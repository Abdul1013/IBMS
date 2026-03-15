import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { User } from '../../models/User.model';
import { Category } from '../../models/Category.model';
import { Announcement } from '../../models/Announcement.model';
import { hashPassword } from '../auth/auth.service';

// Requires running MongoDB — use: docker compose up -d
// Set MONGO_URI=mongodb://localhost:27017/ibms_test before running

let studentToken = '';
let staffToken = '';
let announcementId = '';

const TS = Date.now();

describe('Reactions / Comments / Acknowledgements API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/ibms_test');

    // Create users
    const [studentHash, staffHash] = await Promise.all([
      hashPassword('StudentPass123'),
      hashPassword('StaffPass123'),
    ]);
    const [staff] = await Promise.all([
      User.create({
        name: 'Test Student',
        email: `student_${TS}@lcu.edu.ng`,
        passwordHash: studentHash,
        role: 'STUDENT',
        isVerified: true,
      }),
      User.create({
        name: 'Test Staff',
        email: `staff_${TS}@lcu.edu.ng`,
        passwordHash: staffHash,
        role: 'STAFF',
        isVerified: true,
      }),
    ]);

    // Login both users
    const [sLogin, stLogin] = await Promise.all([
      request(app)
        .post('/api/v1/auth/login')
        .send({ email: `student_${TS}@lcu.edu.ng`, password: 'StudentPass123' }),
      request(app)
        .post('/api/v1/auth/login')
        .send({ email: `staff_${TS}@lcu.edu.ng`, password: 'StaffPass123' }),
    ]);
    studentToken = sLogin.body.data?.accessToken as string;
    staffToken = stLogin.body.data?.accessToken as string;

    // Seed a published announcement directly
    const cat = await Category.create({
      name: 'TestCat',
      slug: `testcat-${TS}`,
      color: '#1A56A0',
      createdBy: staff._id,
    });

    const ann = await Announcement.create({
      title: 'Integration Test Announcement',
      body: '<p>Test content for integration testing purposes.</p>',
      authorId: staff._id,
      category: cat._id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      priority: 'NORMAL',
    });
    announcementId = String(ann._id);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ─── Reactions
  describe('GET /api/v1/announcements/:id/reactions', () => {
    it('returns zeroed counts without auth', async () => {
      const res = await request(app).get(`/api/v1/announcements/${announcementId}/reactions`);
      expect(res.status).toBe(200);
      expect(res.body.data.counts.LIKE).toBe(0);
      expect(res.body.data.counts.HELPFUL).toBe(0);
    });
  });

  describe('POST /api/v1/announcements/:id/reactions', () => {
    it('adds a LIKE reaction', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/reactions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'LIKE' });
      expect(res.status).toBe(200);
      expect(res.body.data.counts.LIKE).toBe(1);
      expect(res.body.data.mine).toContain('LIKE');
    });

    it('toggles LIKE off on second call', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/reactions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'LIKE' });
      expect(res.body.data.counts.LIKE).toBe(0);
      expect(res.body.data.mine).not.toContain('LIKE');
    });

    it('401 without token', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/reactions`)
        .send({ type: 'LIKE' });
      expect(res.status).toBe(401);
    });
  });

  // ─── Acknowledgements
  describe('POST /api/v1/announcements/:id/acknowledge', () => {
    it('records acknowledgement for student', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/acknowledge`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('is idempotent on second call', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/acknowledge`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it('403 for STAFF (student-only endpoint)', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/acknowledge`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── Comments

  describe('POST /api/v1/announcements/:id/comments', () => {
    it('creates a top-level comment', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/comments`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ body: 'This is an integration test comment' });
      expect(res.status).toBe(201);
      expect(res.body.data.body).toBe('This is an integration test comment');
      commentId = res.body.data._id as string;
    });

    it('creates a reply', async () => {
      const res = await request(app)
        .post(`/api/v1/announcements/${announcementId}/comments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ body: 'A reply to the comment', parentId: commentId });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/v1/announcements/:id/comments', () => {
    it('returns threaded comments', async () => {
      const res = await request(app).get(`/api/v1/announcements/${announcementId}/comments`);
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      const topComment = res.body.items.find((c: { _id: string }) => c._id === commentId);
      expect(topComment).toBeDefined();
      expect(topComment.replies.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/v1/comments/:id', () => {
    it('edits own comment', async () => {
      const res = await request(app)
        .patch(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ body: 'Updated comment body' });
      expect(res.status).toBe(200);
      expect(res.body.data.isEdited).toBe(true);
    });

    it('403 editing another user comment', async () => {
      const res = await request(app)
        .patch(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ body: 'Trying to edit someone else comment' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('tombstones the comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ─── Notifications
  describe('GET /api/v1/notifications', () => {
    it('returns unread notifications for staff', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('marks all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
    });
  });
});
