import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { ApiError } from './api-error.js';
import VerificationCode from '../models/VerificationCode.js';

export const CODE_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_CODE_ATTEMPTS = 5;

function getCodeSecret() {
  const secret =
    process.env.VERIFICATION_SECRET ||
    process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(500, 'VERIFICATION_SECRET or JWT_SECRET is not configured.');
    }
    return 'learnloop-local-verification-secret';
  }

  return secret;
}

function hashCode(email, purpose, code) {
  return createHmac('sha256', getCodeSecret())
    .update(`${purpose}:${email}:${code}`)
    .digest('hex');
}

function hashesMatch(left, right) {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createVerificationCode({ email, purpose, name = '' }) {
  const now = new Date();
  const existing = await VerificationCode.findOne({ email, purpose });

  if (existing) {
    const elapsed = now.getTime() - new Date(existing.lastSentAt).getTime();
    const cooldown = RESEND_COOLDOWN_SECONDS * 1000;

    if (elapsed < cooldown) {
      throw new ApiError(
        429,
        `Please wait ${Math.ceil((cooldown - elapsed) / 1000)} seconds before requesting another code.`
      );
    }
  }

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

  await VerificationCode.findOneAndUpdate(
    { email, purpose },
    {
      $set: {
        email,
        purpose,
        name,
        codeHash: hashCode(email, purpose, code),
        attempts: 0,
        lastSentAt: now,
        expiresAt
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return code;
}

export async function consumeVerificationCode({ email, purpose, code }) {
  const record = await VerificationCode.findOne({ email, purpose });

  if (!record) {
    throw new ApiError(400, 'That verification code is invalid or expired.');
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await record.deleteOne();
    throw new ApiError(400, 'That verification code has expired. Request a new one.');
  }

  if (record.attempts >= MAX_CODE_ATTEMPTS) {
    await record.deleteOne();
    throw new ApiError(429, 'Too many incorrect attempts. Request a new code.');
  }

  const matches = hashesMatch(record.codeHash, hashCode(email, purpose, code));

  if (!matches) {
    record.attempts += 1;

    if (record.attempts >= MAX_CODE_ATTEMPTS) {
      await record.deleteOne();
      throw new ApiError(429, 'Too many incorrect attempts. Request a new code.');
    }

    await record.save();
    throw new ApiError(400, 'That verification code is incorrect.');
  }

  await record.deleteOne();
  return record;
}
