import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from './db.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Enrollment from './models/Enrollment.js';
import { seedCourses } from './data/courses.js';

const DEMO_PASSWORD = {
  student: 'Student123!',
  instructor: 'Teach123!'
};

async function upsertUser({ name, email, password, role, headline }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return User.findOneAndUpdate(
    { email },
    { $set: { name, email, passwordHash, role, headline } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function run() {
  await connectDB();
  console.log('Connected to MongoDB. Seeding LearnLoop...');

  // Courses and enrollments are rebuilt so the demo always has valid lesson IDs.
  await Enrollment.deleteMany({});
  await Course.deleteMany({});

  const sara = await upsertUser({
    name: 'Sara Malik',
    email: 'instructor@learnloop.dev',
    password: DEMO_PASSWORD.instructor,
    role: 'instructor',
    headline: 'Senior frontend engineer & educator'
  });

  const ayesha = await upsertUser({
    name: 'Ayesha Khan',
    email: 'student@learnloop.dev',
    password: DEMO_PASSWORD.student,
    role: 'student',
    headline: 'Frontend student, building in public'
  });

  const courses = await Course.insertMany(
    seedCourses.map((course) => ({
      ...course,
      instructor: sara._id,
      published: true
    }))
  );

  const bySlug = Object.fromEntries(courses.map((course) => [course.slug, course]));

  const jsCourse = bySlug['modern-javascript-from-zero'];
  const cssCourse = bySlug['css-layout-masterclass'];
  const designCourse = bySlug['ui-design-foundations'];

  await Enrollment.create([
    {
      user: ayesha._id,
      course: jsCourse._id,
      completedLessons: jsCourse.lessons.slice(0, 2).map((lesson) => lesson._id),
      lastLessonId: jsCourse.lessons[2]?._id || null
    },
    {
      user: ayesha._id,
      course: cssCourse._id,
      completedLessons: cssCourse.lessons.slice(0, 4).map((lesson) => lesson._id),
      lastLessonId: cssCourse.lessons[4]?._id || null
    },
    {
      user: ayesha._id,
      course: designCourse._id,
      completedLessons: [],
      lastLessonId: designCourse.lessons[0]?._id || null
    }
  ]);

  console.log(`\nSeeded ${courses.length} courses and 3 enrollments.`);
  console.log('\nDemo accounts');
  console.log('  Student:    student@learnloop.dev / Student123!');
  console.log('  Instructor: instructor@learnloop.dev / Teach123!\n');

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('\nSeed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
