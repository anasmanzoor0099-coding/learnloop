import { Router } from 'express';
import { z } from 'zod';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { connectDB } from '../db.js';
import { asyncHandler, ApiError } from '../lib/api-error.js';
import { getProgress } from '../lib/progress.js';
import { serializeCourse } from '../lib/serialize.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const completionSchema = z.object({
  completed: z.boolean()
});

const lastLessonSchema = z.object({
  lastLessonId: z.string().min(1)
});

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    await connectDB();

    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name headline' }
      })
      .sort({ updatedAt: -1 });

    const payload = enrollments
      .filter((enrollment) => enrollment.course)
      .map((enrollment) => {
        const course = serializeCourse(enrollment.course, {
          includeLessons: true,
          enrollment,
          isOwner: false
        });
        return {
          id: enrollment._id.toString(),
          enrolledAt: enrollment.createdAt,
          updatedAt: enrollment.updatedAt,
          lastLessonId: enrollment.lastLessonId?.toString() || null,
          progress: getProgress(enrollment.course, enrollment),
          course
        };
      });

    res.json({ enrollments: payload });
  })
);

router.patch(
  '/:courseId',
  requireAuth,
  validateBody(lastLessonSchema),
  asyncHandler(async (req, res) => {
    await connectDB();

    const course = await Course.findById(req.params.courseId);
    if (!course) throw new ApiError(404, 'Course not found.');

    const lesson = course.lessons.id(req.body.lastLessonId);
    if (!lesson) throw new ApiError(404, 'Lesson not found in this course.');

    const enrollment = await Enrollment.findOneAndUpdate(
      { user: req.user._id, course: course._id },
      { $set: { lastLessonId: lesson._id } },
      { new: true }
    );

    if (!enrollment) {
      throw new ApiError(403, 'Enroll in this course to save your progress.');
    }

    res.json({ lastLessonId: enrollment.lastLessonId.toString() });
  })
);

router.put(
  '/:courseId/lessons/:lessonId',
  requireAuth,
  validateBody(completionSchema),
  asyncHandler(async (req, res) => {
    await connectDB();

    const course = await Course.findById(req.params.courseId);
    if (!course) throw new ApiError(404, 'Course not found.');

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) throw new ApiError(404, 'Lesson not found in this course.');

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id
    });

    if (!enrollment) {
      throw new ApiError(403, 'Enroll in this course to track your progress.');
    }

    const update = req.body.completed
      ? {
          $addToSet: { completedLessons: lesson._id },
          $set: { lastLessonId: lesson._id }
        }
      : {
          $pull: { completedLessons: lesson._id },
          $set: { lastLessonId: lesson._id }
        };

    const updated = await Enrollment.findByIdAndUpdate(enrollment._id, update, {
      new: true
    });

    res.json({
      lessonId: lesson._id.toString(),
      completed: req.body.completed,
      progress: getProgress(course, updated)
    });
  })
);

export default router;
