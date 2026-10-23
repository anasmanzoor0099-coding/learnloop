import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';

import {
  AUTH_COOKIE,
  INSTRUCTOR_ACCESS_COOKIE,
  clearAuthCookie,
  requireAuth,
  requireInstructorAccess,
  requireRole,
  setAuthCookie,
  setInstructorAccessCookie,
  signInstructorAccess,
  signToken,
  verifyInstructorCode
} from '../src/middleware/auth.js';
import { validateBody } from '../src/middleware/validate.js';

process.env.JWT_SECRET = 'learnloop-test-secret';
process.env.INSTRUCTOR_ACCESS_CODE = 'studio-test-code';

test('signToken creates a verifiable seven-day token', () => {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    role: 'student'
  };

  const token = signToken(user);
  const payload = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(payload.sub, user._id.toString());
  assert.equal(payload.role, 'student');
  assert.ok(payload.exp - payload.iat >= 6 * 24 * 60 * 60);
});

test('setAuthCookie writes an httpOnly cookie', () => {
  const calls = [];
  const res = {
    cookie: (...args) => calls.push(args),
    clearCookie: (...args) => calls.push(args)
  };

  setAuthCookie(res, 'signed-token');
  const [name, token, options] = calls[0];

  assert.equal(name, AUTH_COOKIE);
  assert.equal(token, 'signed-token');
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
});

test('clearAuthCookie clears the same cookie', () => {
  const calls = [];
  const res = {
    clearCookie: (...args) => calls.push(args)
  };

  clearAuthCookie(res);
  const [name, options] = calls[0];

  assert.equal(name, AUTH_COOKIE);
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, '/');
});

test('verifyInstructorCode accepts only the configured code', () => {
  assert.equal(verifyInstructorCode('studio-test-code'), true);
  assert.equal(verifyInstructorCode('wrong-code'), false);
  assert.equal(verifyInstructorCode(''), false);
});

test('signInstructorAccess creates a scoped eight-hour token', () => {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    role: 'instructor'
  };

  const token = signInstructorAccess(user);
  const payload = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(payload.sub, user._id.toString());
  assert.equal(payload.scope, 'instructor-access');
  assert.ok(payload.exp - payload.iat >= 7 * 60 * 60);
});

test('setInstructorAccessCookie scopes the cookie to instructor API routes', () => {
  const calls = [];
  const res = {
    cookie: (...args) => calls.push(args)
  };

  setInstructorAccessCookie(res, 'access-token');
  const [name, token, options] = calls[0];

  assert.equal(name, INSTRUCTOR_ACCESS_COOKIE);
  assert.equal(token, 'access-token');
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/api/instructor');
});

test('requireInstructorAccess rejects a missing access cookie', () => {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    role: 'instructor'
  };
  let received;

  requireInstructorAccess({ user, cookies: {} }, null, (error) => {
    received = error;
  });

  assert.equal(received.status, 403);
  assert.match(received.message, /access code/i);
});

test('requireInstructorAccess accepts a matching access token', () => {
  const user = {
    _id: new mongoose.Types.ObjectId(),
    role: 'instructor'
  };
  const token = signInstructorAccess(user);
  const req = {
    user,
    cookies: { [INSTRUCTOR_ACCESS_COOKIE]: token }
  };
  let called = false;

  requireInstructorAccess(req, null, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.instructorAccess, true);
});

test('requireInstructorAccess rejects a token for another user', () => {
  const owner = {
    _id: new mongoose.Types.ObjectId(),
    role: 'instructor'
  };
  const other = {
    _id: new mongoose.Types.ObjectId(),
    role: 'instructor'
  };
  const token = signInstructorAccess(owner);
  let received;

  requireInstructorAccess(
    { user: other, cookies: { [INSTRUCTOR_ACCESS_COOKIE]: token } },
    null,
    (error) => {
      received = error;
    }
  );

  assert.equal(received.status, 403);
});

test('requireAuth rejects a visitor without a user', () => {
  let received;

  requireAuth({}, null, (error) => {
    received = error;
  });

  assert.equal(received.status, 401);
  assert.match(received.message, /log in/i);
});

test('requireRole rejects the wrong role', () => {
  let received;
  const guard = requireRole('instructor');

  guard({ user: { role: 'student' } }, null, (error) => {
    received = error;
  });

  assert.equal(received.status, 403);
});

test('requireRole allows the correct role', () => {
  let called = false;
  const guard = requireRole('instructor');

  guard({ user: { role: 'instructor' } }, null, () => {
    called = true;
  });

  assert.equal(called, true);
});

test('validateBody returns field-level errors', () => {
  const schema = z.object({
    email: z.string().email('Enter a valid email address.')
  });
  const middleware = validateBody(schema);
  let received;

  middleware({ body: { email: 'not-an-email' } }, null, (error) => {
    received = error;
  });

  assert.equal(received.status, 400);
  assert.deepEqual(received.details.email, ['Enter a valid email address.']);
});

test('validateBody replaces the body with parsed data', () => {
  const schema = z.object({
    email: z.string().trim().toLowerCase().email()
  });
  const middleware = validateBody(schema);
  const req = { body: { email: '  Student@Example.com ' } };
  let called = false;

  middleware(req, null, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.body.email, 'student@example.com');
});
