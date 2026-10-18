import mongoose from 'mongoose';

export const CATEGORIES = [
  'Web Development',
  'JavaScript',
  'Backend',
  'Design',
  'Data',
  'Career'
];

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
export const ACCENTS = ['mint', 'sun', 'sky', 'rose', 'violet', 'sand'];

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  summary: {
    type: String,
    default: '',
    maxlength: 240
  },
  duration: {
    type: Number,
    default: 10,
    min: 1,
    max: 240
  },
  content: {
    type: [String],
    default: []
  }
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 90
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true
    },
    level: {
      type: String,
      enum: LEVELS,
      required: true
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      max: 9999
    },
    accent: {
      type: String,
      enum: ACCENTS,
      default: 'mint'
    },
    outcomes: {
      type: [String],
      default: []
    },
    requirements: {
      type: [String],
      default: []
    },
    lessons: {
      type: [lessonSchema],
      default: []
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    published: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

courseSchema.index({ published: 1, createdAt: -1 });
courseSchema.index({ category: 1, level: 1 });

export default mongoose.models.Course || mongoose.model('Course', courseSchema);
