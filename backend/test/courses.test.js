import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';

import { getProgress } from '../src/lib/progress.js';
import { serializeCourse } from '../src/lib/serialize.js';
import app from '../src/app.js';

function fakeCourse() {
  const instructorId = new mongoose.Types.ObjectId();
  const lessons = [
    {
      _id: new mongoose.Types.ObjectId(),
      title: 'First lesson',
      summary: 'Start here.',
      duration: 12,
      content: ['Paragraph one.', 'Paragraph two.']
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: 'Second lesson',
      summary: 'Keep going.',
      duration: 18,
      content: ['More content.']
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: 'Third lesson',
      summary: 'Finish strong.',
      duration: 20,
      content: ['Final content.']
    }
  ];

  const course = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Test Course',
    slug: 'test-course',
    tagline: 'A practical test course.',
    description: 'A longer description of the test course.',
    category: 'JavaScript',
    level: 'Beginner',
    price: 0,
    accent: 'sun',
    outcomes: ['Outcome one'],
    requirements: ['Requirement one'],
    rating: 4.8,
    reviewCount: 10,
    published: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    instructor: {
      _id: instructorId,
      name: 'Anas Manzoor',
      headline: 'Software Engineering Student'
    },
    lessons
  };

  return { course, lessons, instructorId };
}

test('getProgress ignores completed IDs that are not in the course', () => {
  const { course, lessons } = fakeCourse();
  const enrollment = {
    completedLessons: [lessons[0]._id, lessons[2]._id, new mongoose.Types.ObjectId()]
  };

  const progress = getProgress(course, enrollment);

  assert.equal(progress.completedLessons, 2);
  assert.equal(progress.totalLessons, 3);
  assert.equal(progress.percent, 67);
  assert.equal(progress.minutesLearned, 32);
  assert.equal(progress.totalMinutes, 50);
  assert.deepEqual(progress.completedLessonIds, [
    lessons[0]._id.toString(),
    lessons[2]._id.toString()
  ]);
});

test('getProgress returns zero for a new enrollment', () => {
  const { course } = fakeCourse();
  const progress = getProgress(course, { completedLessons: [] });

  assert.equal(progress.completedLessons, 0);
  assert.equal(progress.percent, 0);
});

test('serializeCourse hides lesson content unless requested', () => {
  const { course } = fakeCourse();
  const summary = serializeCourse(course, { includeLessons: true });

  assert.equal(summary.lessonCount, 3);
  assert.equal(summary.totalMinutes, 50);
  assert.equal(summary.lessons.length, 3);
  assert.equal('content' in summary.lessons[0], false);
  assert.equal(summary.instructor.name, 'Anas Manzoor');
});

test('serializeCourse includes content and progress when requested', () => {
  const { course, lessons } = fakeCourse();
  const full = serializeCourse(course, {
    includeLessons: true,
    includeContent: true,
    enrollment: {
      completedLessons: [lessons[0]._id],
      lastLessonId: lessons[1]._id
    }
  });

  assert.deepEqual(full.lessons[0].content, [
    'Paragraph one.',
    'Paragraph two.'
  ]);
  assert.equal(full.progress.percent, 33);
  assert.equal(full.enrolled, true);
  assert.equal(full.lastLessonId, lessons[1]._id.toString());
});

test('course catalog rejects an invalid level before touching MongoDB', async () => {
  const response = await request(app)
    .get('/api/courses?level=Expert')
    .expect(400);

  assert.match(response.body.error, /filter/i);
});

test('lesson content requires authentication', async () => {
  const response = await request(app)
    .get('/api/courses/test-course/learn')
    .expect(401);

  assert.match(response.body.error, /log in/i);
});

test('student enrollments require authentication', async () => {
  const response = await request(app).get('/api/enrollments/me').expect(401);

  assert.match(response.body.error, /log in/i);
});
