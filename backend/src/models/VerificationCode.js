import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 120
    },
    purpose: {
      type: String,
      enum: ['register', 'reset'],
      required: true
    },
    name: {
      type: String,
      default: '',
      maxlength: 60
    },
    codeHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

verificationCodeSchema.index({ email: 1, purpose: 1 }, { unique: true });
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.VerificationCode ||
  mongoose.model('VerificationCode', verificationCodeSchema);
