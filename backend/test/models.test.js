import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Enrollment from '../src/models/Enrollment.js';
import { seedCourses } from '../src/data/courses.js';
import { connectDB } from '../src/db.js';

test('User requires a valid email and hides the password hash', async () => {
  const invalid = new User({
    name: 'Test User',
    email: 'not-an-email',
    passwordHash: 'hash'
  });

  await assert.rejects(invalid.validate(), /valid email address/i);
  assert.equal(User.schema.path('passwordHash').options.select, false);
});

test('User.toSafeJSON never returns the password hash', () => {
  const user = new User({
    name: 'Ayesha Khan',
    email: 'ayesha@example.com',
    passwordHash: 'super-secret-hash'
  });

  const safe = user.toSafeJSON();
  assert.equal(safe.name, 'Ayesha Khan');
  assert.equal(safe.email, 'ayesha@example.com');
  assert.equal('passwordHash' in safe, false);
});

test('Course applies sensible defaults', async () => {
  const course = new Course({
    title: 'Test Course',
    slug: 'test-course',
    tagline: 'A short and useful test course.',
    description: 'A longer description that is definitely over twenty characters.',
    category: 'JavaScript',
    level: 'Beginner',
    instructor: new mongoose.Types.ObjectId()
  });

  await course.validate();
  assert.equal(course.price, 0);
  assert.equal(course.accent, 'mint');
  assert.equal(course.published, false);
  assert.equal(course.lessons.length, 0);
});

test('Course rejects an invalid category', async () => {
  const course = new Course({
    title: 'Test Course',
    slug: 'test-course',
    tagline: 'A short and useful test course.',
    description: 'A longer description that is definitely over twenty characters.',
    category: 'Cooking',
    level: 'Beginner',
    instructor: new mongoose.Types.ObjectId()
  });

  await assert.rejects(course.validate(), /Cooking/);
});

test('Seed data contains six valid, unique courses', async () => {
  assert.equal(seedCourses.length, 6);

  const slugs = new Set();
  for (const data of seedCourses) {
    assert.equal(slugs.has(data.slug), false, `Duplicate slug: ${data.slug}`);
    slugs.add(data.slug);

    const course = new Course({
      ...data,
      instructor: new mongoose.Types.ObjectId()
    });

    await course.validate();
    assert.ok(course.lessons.length >= 5, `${course.title} has too few lessons`);
    assert.ok(
      course.lessons.every((lesson) => lesson.content.length > 0),
      `${course.title} has a lesson without content`
    );
    assert.ok(course.outcomes.length >= 3);
  }
});

test('Enrollment has a unique user/course index', () => {
  const indexes = Enrollment.schema.indexes();
  const uniqueIndex = indexes.find(
    ([fields, options]) =>
      fields.user === 1 && fields.course === 1 && options.unique === true
  );

  assert.ok(uniqueIndex, 'Expected a unique { user, course } index');
});

test('connectDB explains when MongoDB is not configured', async () => {
  const previous = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  try {
    await assert.rejects(connectDB(), /MONGODB_URI/i);
  } finally {
    if (previous === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous;
  }
});
