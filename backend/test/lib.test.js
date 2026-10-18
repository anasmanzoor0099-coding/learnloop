import test from 'node:test';
import assert from 'node:assert/strict';

import { slugify, uniqueSlug } from '../src/lib/slugify.js';
import { escapeRegex } from '../src/lib/search.js';

test('slugify creates clean, URL-safe course slugs', () => {
  assert.equal(
    slugify('  Modern JavaScript: From Zero!  '),
    'modern-javascript-from-zero'
  );
  assert.equal(slugify('C++ & CSS'), 'c-css');
  assert.equal(slugify('***'), 'course');
  assert.ok(slugify('a'.repeat(120)).length <= 72);
});

test('uniqueSlug adds a suffix when the base slug exists', async () => {
  const existing = new Set(['test-course', 'test-course-2']);
  const fakeCourse = {
    exists: async ({ slug }) => existing.has(slug)
  };

  assert.equal(await uniqueSlug(fakeCourse, 'Test Course'), 'test-course-3');
});

test('escapeRegex neutralises special characters', () => {
  const pattern = new RegExp(escapeRegex('react + node.js (2026)'), 'i');

  assert.equal(pattern.test('Build with React + Node.js (2026)'), true);
  assert.equal(pattern.test('Vue'), false);
});
