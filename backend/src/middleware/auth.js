import { timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../lib/api-error.js';

export const AUTH_COOKIE = 'learnloop_token';
export const INSTRUCTOR_ACCESS_COOKIE = 'learnloop_instructor_access';

const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const INSTRUCTOR_ACCESS_MAX_AGE = 8 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(500, 'JWT_SECRET is not configured.');
    }
    return 'learnloop-local-development-secret';
  }

  return secret;
}

function getInstructorCode() {
  const code = process.env.INSTRUCTOR_ACCESS_CODE;

  if (!code) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(500, 'INSTRUCTOR_ACCESS_CODE is not configured.');
    }
    return 'TeachStudio2026!';
  }

  return String(code).trim();
}

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    getSecret(),
    { expiresIn: '7d' }
  );
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};

const instructorCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/instructor'
};

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: MAX_AGE
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}

export function signInstructorAccess(user) {
  return jwt.sign(
    { sub: user._id.toString(), scope: 'instructor-access' },
    getSecret(),
    { expiresIn: '8h' }
  );
}

export function setInstructorAccessCookie(res, token) {
  res.cookie(INSTRUCTOR_ACCESS_COOKIE, token, {
    ...instructorCookieOptions,
    maxAge: INSTRUCTOR_ACCESS_MAX_AGE
  });
}

export function clearInstructorAccessCookie(res) {
  res.clearCookie(INSTRUCTOR_ACCESS_COOKIE, instructorCookieOptions);
}

export function verifyInstructorCode(input) {
  const expected = Buffer.from(getInstructorCode());
  const submitted = Buffer.from(String(input || ''));

  if (submitted.length !== expected.length) return false;
  return timingSafeEqual(submitted, expected);
}

function tokenFromRequest(req) {
  if (req.cookies?.[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
}

function accessTokenFromRequest(req) {
  return req.cookies?.[INSTRUCTOR_ACCESS_COOKIE] || null;
}

export async function optionalAuth(req, _res, next) {
  const token = tokenFromRequest(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, getSecret());
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // Expired or invalid tokens are treated as logged out.
  }

  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Please log in to continue.'));
  }
  next();
}

export function requireRole(...roles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Please log in to continue.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have access to that area.'));
    }
    next();
  };
}

function hasValidInstructorAccess(req) {
  const token = accessTokenFromRequest(req);
  if (!token || !req.user) return false;

  try {
    const payload = jwt.verify(token, getSecret());
    return (
      payload.scope === 'instructor-access' &&
      payload.sub === req.user._id.toString()
    );
  } catch {
    return false;
  }
}

export function optionalInstructorAccess(req, _res, next) {
  req.instructorAccess = hasValidInstructorAccess(req);
  next();
}

export function requireInstructorAccess(req, _res, next) {
  if (!hasValidInstructorAccess(req)) {
    return next(
      new ApiError(
        403,
        'Enter the instructor access code to open the Studio.'
      )
    );
  }

  req.instructorAccess = true;
  next();
}
