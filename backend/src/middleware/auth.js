import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../lib/api-error.js';

export const AUTH_COOKIE = 'learnloop_token';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: MAX_AGE
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}

function tokenFromRequest(req) {
  if (req.cookies?.[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
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
