import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { connectDB } from '../db.js';
import { asyncHandler, ApiError } from '../lib/api-error.js';
import { validateBody } from '../middleware/validate.js';
import {
  clearAuthCookie,
  clearInstructorAccessCookie,
  setAuthCookie,
  signToken
} from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(60),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(120),
  password: z.string().min(8, 'Use at least 8 characters.').max(72)
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.')
});

router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    await connectDB();
    const { name, email, password } = req.body;

    const existing = await User.exists({ email });
    if (existing) {
      throw new ApiError(409, 'An account with that email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'student',
      headline: 'Learning something new'
    });

    clearInstructorAccessCookie(res);
    setAuthCookie(res, signToken(user));
    res.status(201).json({ user: user.toSafeJSON() });
  })
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    await connectDB();
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new ApiError(401, 'Email or password is incorrect.');
    }

    clearInstructorAccessCookie(res);
    setAuthCookie(res, signToken(user));
    res.json({ user: user.toSafeJSON() });
  })
);

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  clearInstructorAccessCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? req.user.toSafeJSON() : null });
});

export default router;
