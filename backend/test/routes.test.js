import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../src/app.js';

test('GET /api/health returns a healthy response', async () => {
  const response = await request(app).get('/api/health').expect(200);

  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, 'learnloop-api');
});

test('GET /api/auth/me returns null for a guest', async () => {
  const response = await request(app).get('/api/auth/me').expect(200);

  assert.equal(response.body.user, null);
});

test('POST /api/auth/register validates fields before touching MongoDB', async () => {
  const response = await request(app).post('/api/auth/register').send({}).expect(400);

  assert.match(response.body.error, /highlighted fields/i);
  assert.ok(response.body.details.name);
  assert.ok(response.body.details.email);
  assert.ok(response.body.details.password);
});

test('POST /api/auth/login rejects an invalid email', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'not-an-email', password: 'x' })
    .expect(400);

  assert.ok(response.body.details.email);
});

test('instructor routes reject guests before touching MongoDB', async () => {
  const response = await request(app).get('/api/instructor/courses').expect(401);

  assert.match(response.body.error, /log in/i);
});

test('instructor access check rejects guests', async () => {
  const response = await request(app).get('/api/instructor/access').expect(401);

  assert.match(response.body.error, /log in/i);
});

test('unknown API routes return JSON 404', async () => {
  const response = await request(app).get('/api/does-not-exist').expect(404);

  assert.equal(response.body.error, 'API route not found.');
});
