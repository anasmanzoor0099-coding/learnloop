import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120
    },
    otpHash: {
      type: String,
      required: true,
      select: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSentAt: {
      type: Date,
      required: true
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verificationTokenHash: {
      type: String,
      default: null,
      select: false
    }
  },
  { timestamps: true }
);

export default mongoose.models.EmailVerification ||
  mongoose.model('EmailVerification', emailVerificationSchema);