import { Router } from 'express';
import { z } from 'zod';
import Course, { ACCENTS, CATEGORIES, LEVELS } from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { connectDB } from '../db.js';
import { asyncHandler, ApiError } from '../lib/api-error.js';
import { serializeCourse } from '../lib/serialize.js';
import { uniqueSlug } from '../lib/slugify.js';
import { requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const courseFields = {
  title: z.string().trim().min(4).max(120),
  tagline: z.string().trim().min(8).max(180),
  description: z.string().trim().min(20).max(2000),
  category: z.enum(CATEGORIES),
  level: z.enum(LEVELS),
  price: z.coerce.number().min(0).max(9999),
  accent: z.enum(ACCENTS),
  outcomes: z.array(z.string().trim().min(2).max(160)).max(12),
  requirements: z.array(z.string().trim().min(2).max(160)).max(12),
  published: z.boolean()
};

const createCourseSchema = z.object({
  ...courseFields,
  price: courseFields.price.default(0),
  accent: courseFields.accent.default('mint'),
  outcomes: courseFields.outcomes.default([]),
  requirements: courseFields.requirements.default([]),
  published: courseFields.published.default(false)
});

const updateCourseSchema = z.object(courseFields).partial();

const lessonSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().max(240).optional().default(''),
  duration: z.coerce.number().int().min(1).max(240).default(10),
  content: z
    .array(z.string().trim().min(1).max(6000))
    .min(1, 'Add at least one paragraph of lesson content.')
    .max(40)
});

router.use(requireRole('instructor'));

router.get(
  '/courses',
  asyncHandler(async (req, res) => {
    await connectDB();
    const courses = await Course.find({ instructor: req.user._id })
      .populate('instructor', 'name headline')
      .sort({ updatedAt: -1 });

    const counts = await Enrollment.aggregate([
      { $match: { course: { $in: courses.map((course) => course._id) } } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);
    const countByCourse = new Map(
      counts.map((item) => [item._id.toString(), item.count])
    );

    res.json({
      courses: courses.map((course) => ({
        ...serializeCourse(course, {
          includeLessons: true,
          includeContent: true,
          isOwner: true
        }),
        students: countByCourse.get(course._id.toString()) || 0
      }))
    });
  })
);

router.post(
  '/courses',
  validateBody(createCourseSchema),
  asyncHandler(async (req, res) => {
    await connectDB();
    const slug = await uniqueSlug(Course, req.body.title);
    const course = await Course.create({
      ...req.body,
      slug,
      instructor: req.user._id,
      published: false
    });

    res.status(201).json({
      course: serializeCourse(course, {
        includeLessons: true,
        includeContent: true,
        isOwner: true
      })
    });
  })
);

router.patch(
  '/courses/:id',
  validateBody(updateCourseSchema),
  asyncHandler(async (req, res) => {
    await connectDB();
    const course = await Course.findOne({
      _id: req.params.id,
      instructor: req.user._id
    });

    if (!course) throw new ApiError(404, 'Course not found.');

    if (req.body.published === true && course.lessons.length === 0) {
      throw new ApiError(400, 'Add at least one lesson before publishing.');
    }

    for (const [key, value] of Object.entries(req.body)) {
      course[key] = value;
    }

    await course.save();

    res.json({
      course: serializeCourse(course, {
        includeLessons: true,
        includeContent: true,
        isOwner: true
      })
    });
  })
);

router.post(
  '/courses/:id/lessons',
  validateBody(lessonSchema),
  asyncHandler(async (req, res) => {
    await connectDB();
    const course = await Course.findOne({
      _id: req.params.id,
      instructor: req.user._id
    });

    if (!course) throw new ApiError(404, 'Course not found.');

    course.lessons.push(req.body);
    await course.save();

    res.status(201).json({
      course: serializeCourse(course, {
        includeLessons: true,
        includeContent: true,
        isOwner: true
      })
    });
  })
);

router.delete(
  '/courses/:id/lessons/:lessonId',
  asyncHandler(async (req, res) => {
    await connectDB();
    const course = await Course.findOne({
      _id: req.params.id,
      instructor: req.user._id
    });

    if (!course) throw new ApiError(404, 'Course not found.');

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) throw new ApiError(404, 'Lesson not found.');

    const lessonId = lesson._id;
    lesson.deleteOne();
    await course.save();
    await Enrollment.updateMany(
      { course: course._id },
      { $pull: { completedLessons: lessonId } }
    );
    await Enrollment.updateMany(
      { course: course._id, lastLessonId: lessonId },
      { $set: { lastLessonId: null } }
    );

    res.json({
      course: serializeCourse(course, {
        includeLessons: true,
        includeContent: true,
        isOwner: true
      })
    });
  })
);

router.delete(
  '/courses/:id',
  asyncHandler(async (req, res) => {
    await connectDB();
    const course = await Course.findOne({
      _id: req.params.id,
      instructor: req.user._id
    });

    if (!course) throw new ApiError(404, 'Course not found.');

    await course.deleteOne();
    await Enrollment.deleteMany({ course: course._id });

    res.json({ ok: true });
  })
);

export default router;
