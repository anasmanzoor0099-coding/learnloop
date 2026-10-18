import { Router } from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { connectDB } from '../db.js';
import { asyncHandler } from '../lib/api-error.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    await connectDB();

    const [courses, students] = await Promise.all([
      Course.find({ published: true }).select('lessons'),
      User.countDocuments({ role: 'student' })
    ]);

    const lessons = courses.reduce(
      (total, course) => total + course.lessons.length,
      0
    );
    const minutes = courses.reduce(
      (total, course) =>
        total +
        course.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
      0
    );

    res.json({
      courses: courses.length,
      students,
      lessons,
      hours: Math.round(minutes / 60)
    });
  })
);

export default router;
