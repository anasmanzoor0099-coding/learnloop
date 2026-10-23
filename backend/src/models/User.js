import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.']
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'instructor'],
      default: 'student'
    },
    headline: {
      type: String,
      default: 'LearnLoop student',
      maxlength: 100
    },
    bio: {
      type: String,
      default: '',
      maxlength: 400
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    headline: this.headline,
    bio: this.bio,
    createdAt: this.createdAt
  };
};

export default mongoose.models.User || mongoose.model('User', userSchema);
