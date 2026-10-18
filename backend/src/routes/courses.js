import { Router } from 'express';
import { z } from 'zod';
import Course, { CATEGORIES, LEVELS } from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { connectDB } from '../db.js';
import { asyncHandler, ApiError } from '../lib/api-error.js';
import { serializeCourse } from '../lib/serialize.js';
import { escapeRegex } from '../lib/search.js';
import { requireAuth } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';

const router = Router();

const listQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(''),
  category: z.string().trim().max(50).optional().default(''),
  level: z.union([z.enum(LEVELS), z.literal('')]).optional().default('')
});

router.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    await connectDB();
    const { search, category, level } = req.validatedQuery;

    const filter = { published: true };

    if (category) {
      if (!CATEGORIES.includes(category)) {
        throw new ApiError(400, 'Unknown course category.');
      }
      filter.category = category;
    }

    if (level) filter.level = level;

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { title: pattern },
        { tagline: pattern },
        { description: pattern },
        { category: pattern }
      ];
    }

    const courses = await Course.find(filter)
      .select('-lessons.content')
      .populate('instructor', 'name headline')
      .sort({ createdAt: -1 })
      .limit(60);

    res.json({ courses: courses.map((course) => serializeCourse(course)) });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    await connectDB();
    const course = await Course.findOne({ slug: req.params.slug })
      .select('-lessons.content')
      .populate('instructor', 'name headline');

    if (!course) throw new ApiError(404, 'Course not found.');

    const instructorId = course.instructor?._id?.toString() || course.instructor?.toString();
    const isOwner =
      Boolean(req.user) && instructorId === req.user._id.toString();

    if (!course.published && !isOwner) {
      throw new ApiError(404, 'Course not found.');
    }

    const enrollment = req.user
      ? await Enrollment.findOne({ user: req.user._id, course: course._id })
      : null;

    res.json({
      course: serializeCourse(course, {
        includeLessons: true,
        enrollment,
        isOwner
      })
    });
  })
);

router.get(
  '/:slug/learn',
  requireAuth,
  asyncHandler(async (req, res) => {
    await connectDB();
    const course = await Course.findOne({ slug: req.params.slug }).populate(
      'instructor',
      'name headline'
    );

    if (!course) throw new ApiError(404, 'Course not found.');

    const isOwner = course.instructor._id.toString() === req.user._id.toString();
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id
    });

    if (!course.published && !isOwner) {
      throw new ApiError(404, 'Course not found.');
    }

    if (!enrollment && !isOwner) {
      throw new ApiError(403, 'Enroll in this course to open its lessons.');
    }

    res.json({
      course: serializeCourse(course, {
        includeLessons: true,
        includeContent: true,
        enrollment,
        isOwner
      })
    });
  })
);

router.post(
  '/:id/enroll',
  requireAuth,
  asyncHandler(async (req, res) => {
    await connectDB();
    const course = await Course.findOne({
      _id: req.params.id,
      published: true
    })
      .select('-lessons.content')
      .populate('instructor', 'name headline');

    if (!course) throw new ApiError(404, 'Course not found.');

    if (course.instructor._id.toString() === req.user._id.toString()) {
      throw new ApiError(400, 'You already teach this course.');
    }

    let enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id
    });
    let created = false;

    if (!enrollment) {
      enrollment = await Enrollment.create({
        user: req.user._id,
        course: course._id,
        lastLessonId: course.lessons[0]?._id || null
      });
      created = true;
    }

    res.status(created ? 201 : 200).json({
      enrollment: {
        id: enrollment._id.toString(),
        courseId: course._id.toString()
      },
      course: serializeCourse(course, {
        includeLessons: true,
        enrollment
      })
    });
  })
);

export default router;
