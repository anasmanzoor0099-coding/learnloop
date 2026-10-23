import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual
} from 'node:crypto';
import nodemailer from 'nodemailer';

import User from '../models/User.js';
import EmailVerification from '../models/EmailVerification.js';
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

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const VERIFIED_LIFETIME_MS = 15 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address.')
  .max(120);

const sendOtpSchema = z.object({
  email: emailSchema
});

const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.')
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(60),
  email: emailSchema,
  password: z.string().min(8, 'Use at least 8 characters.').max(72),
  verificationToken: z.string().min(32).max(200)
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.')
});

function getOtpSecret() {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, 'Email verification is not configured.');
  }

  return secret;
}

function hashOtp(email, code) {
  return createHmac('sha256', getOtpSecret())
    .update(`${email}:${code}`)
    .digest('hex');
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function safeEqualHex(left, right) {
  if (
    typeof left !== 'string' ||
    typeof right !== 'string' ||
    !/^[a-f0-9]{64}$/.test(left) ||
    !/^[a-f0-9]{64}$/.test(right)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(left, 'hex'),
    Buffer.from(right, 'hex')
  );
}

function createMailer() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new ApiError(500, 'Email delivery is not configured.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

/*
 * STEP 1: Send an email OTP.
 */
router.post(
  '/send-otp',
  validateBody(sendOtpSchema),
  asyncHandler(async (req, res) => {
    await connectDB();

    const email = req.body.email;
    const existingUser = await User.exists({ email });

    if (existingUser) {
      throw new ApiError(409, 'An account with that email already exists.');
    }

    let verification = await EmailVerification.findOne({ email });

    if (
      verification &&
      Date.now() - new Date(verification.lastSentAt).getTime() <
        RESEND_WAIT_MS
    ) {
      throw new ApiError(
        429,
        'Please wait 60 seconds before requesting another code.'
      );
    }

    const code = String(randomInt(100000, 1000000));
    const now = new Date();

    if (!verification) {
      verification = new EmailVerification({ email });
    }

    verification.otpHash = hashOtp(email, code);
    verification.expiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
    verification.attempts = 0;
    verification.lastSentAt = now;
    verification.verifiedAt = null;
    verification.verificationTokenHash = null;

    await verification.save();

    try {
      const mailer = createMailer();

      await mailer.sendMail({
        from: `"LearnLoop" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your LearnLoop verification code',
        text: [
          `Your LearnLoop verification code is ${code}.`,
          '',
          'This code expires in 10 minutes.',
          'Do not share this code with anyone.',
          'If you did not request this code, you can ignore this email.'
        ].join('\n'),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#222">
            <h2 style="color:#6b4e16">Verify your email</h2>
            <p>Use this code to continue creating your LearnLoop account:</p>
            <div style="font-size:32px;letter-spacing:8px;font-weight:bold;padding:20px 0">
              ${code}
            </div>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p>Never share your code with anyone.</p>
          </div>
        `
      });
    } catch (error) {
      await EmailVerification.deleteOne({ email });
      console.error('[learnloop] OTP email delivery failed:', error);
      throw new ApiError(
        503,
        'We could not send the verification email. Please try again later.'
      );
    }

    res.json({
      message: 'If this email can be registered, a verification code has been sent.'
    });
  })
);

/*
 * STEP 2: Verify the OTP and issue a one-time registration token.
 */
router.post(
  '/verify-otp',
  validateBody(verifyOtpSchema),
  asyncHandler(async (req, res) => {
    await connectDB();

    const { email, code } = req.body;

    const verification = await EmailVerification.findOne({ email }).select(
      '+otpHash +verificationTokenHash'
    );

    if (!verification || verification.verifiedAt) {
      throw new ApiError(400, 'This code is invalid or expired. Request a new code.');
    }

    if (verification.expiresAt.getTime() <= Date.now()) {
      await EmailVerification.deleteOne({ _id: verification._id });
      throw new ApiError(400, 'This code has expired. Request a new code.');
    }

    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      await EmailVerification.deleteOne({ _id: verification._id });
      throw new ApiError(429, 'Too many incorrect attempts. Request a new code.');
    }

    const submittedHash = hashOtp(email, code);

    if (!safeEqualHex(verification.otpHash, submittedHash)) {
      verification.attempts += 1;
      await verification.save();

      throw new ApiError(
        400,
        `Incorrect code. ${MAX_OTP_ATTEMPTS - verification.attempts} attempts remaining.`
      );
    }

    const verificationToken = randomBytes(32).toString('hex');

    verification.verifiedAt = new Date();
    verification.verificationTokenHash = hashToken(verificationToken);
    verification.expiresAt = new Date(Date.now() + VERIFIED_LIFETIME_MS);

    await verification.save();

    res.json({
      message: 'Email verified successfully.',
      verificationToken
    });
  })
);

/*
 * STEP 3: Create a student account only after email verification.
 */
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    await connectDB();

    const { name, email, password, verificationToken } = req.body;

    const verification = await EmailVerification.findOne({
      email,
      verifiedAt: { $ne: null },
      expiresAt: { $gt: new Date() }
    }).select('+verificationTokenHash');

    if (
      !verification ||
      !verification.verificationTokenHash ||
      !safeEqualHex(
        verification.verificationTokenHash,
        hashToken(verificationToken)
      )
    ) {
      throw new ApiError(
        403,
        'Please verify your email before creating your account.'
      );
    }

    if (await User.exists({ email })) {
      await EmailVerification.deleteOne({ _id: verification._id });
      throw new ApiError(409, 'An account with that email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;

    try {
      user = await User.create({
        name,
        email,
        passwordHash,
        role: 'student',
        headline: 'Learning something new'
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'An account with that email already exists.');
      }

      throw error;
    }

    // Consume the verification record after successful registration.
    await EmailVerification.deleteOne({ _id: verification._id });

    clearInstructorAccessCookie(res);
    setAuthCookie(res, signToken(user));

    res.status(201).json({ user: user.toSafeJSON() });
  })
);

/*
 * EXISTING LOGIN: preserved for students and instructors.
 */
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