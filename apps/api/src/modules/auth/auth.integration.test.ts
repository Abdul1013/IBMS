import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';

// Requires running MongoDB — use: docker compose up -d
// Set MONGO_URI=mongodb://localhost:27017/ibms_test before running

const TEST_USER = {
  name: 'Test Student',
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123',
  confirmPassword: 'TestPass123',
  role: 'STUDENT',
  matricNo: 'LCU/TEST/001',
};

describe('Auth API — integration', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/ibms_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('POST /register — creates user and returns 201', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(TEST_USER.email);
  });

  it('POST /register — rejects duplicate email with 409', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('POST /register — rejects missing password with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...TEST_USER, password: '' });
    expect(res.status).toBe(400);
  });

  it('POST /login — rejects unverified user with 403', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('POST /login — rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'WrongPass999' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /forgot-password — always returns 200 (no email leak)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /me — returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
