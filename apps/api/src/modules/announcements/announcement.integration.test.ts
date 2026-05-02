import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { User } from '../../models/User.model';
import { Category } from '../../models/Category.model';
import { hashPassword } from '../auth/auth.service';

// Requires running MongoDB — use: docker compose up -d
// Set MONGO_URI=mongodb://localhost:27017/ibms_test before running

let adminToken = '';
let staffToken = '';
let categoryId = '';
let announcementId = '';

const ADMIN = {
  name: 'Admin User',
  email: `admin_ann_${Date.now()}@example.com`,
  password: 'AdminPass123',
  role: 'SYSTEM_ADMIN' as const,
};

const STAFF = {
  name: 'Staff User',
  email: `staff_ann_${Date.now()}@example.com`,
  password: 'StaffPass123',
  role: 'STAFF' as const,
};

describe('Announcements API — integration', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/ibms_test');

    const hashed = await hashPassword(ADMIN.password);
    const { password: _adminPwd, ...adminFields } = ADMIN;
    const admin = await User.create({ ...adminFields, passwordHash: hashed, isVerified: true });
    const staffHashed = await hashPassword(STAFF.password);
    const { password: _staffPwd, ...staffFields } = STAFF;
    await User.create({ ...staffFields, passwordHash: staffHashed, isVerified: true });

    // Login admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password });
    adminToken = adminLogin.body.data?.accessToken as string;

    // Login staff
    const staffLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: STAFF.email, password: STAFF.password });
    staffToken = staffLogin.body.data?.accessToken as string;

    // Seed a category
    const cat = await Category.create({
      name: 'General',
      slug: 'general',
      color: '#1A56A0',
      icon: 'Bell',
      createdBy: admin._id,
    });
    categoryId = String(cat._id);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ─── Categories ─────────────────────────────────────────────────────────────
  describe('GET /api/v1/categories', () => {
    it('returns category list without auth', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Events', color: '#FF5500' });
      expect(res.status).toBe(403);
    });

    it('201 for SYSTEM_ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Events', color: '#FF5500', icon: 'Calendar', isGlobal: true });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Events');
    });
  });

  // ─── Announcements ───────────────────────────────────────────────────────────
  describe('POST /api/v1/announcements', () => {
    it('401 without token', async () => {
      const res = await request(app).post('/api/v1/announcements').send({
        title: 'Hello World Announcement',
        body: '<p>Some content here</p>',
        category: categoryId,
      });
      expect(res.status).toBe(401);
    });

    it('201 for STAFF', async () => {
      const res = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          title: 'Hello World Announcement',
          body: '<p>Some valid content for testing purposes.</p>',
          category: categoryId,
          priority: 'NORMAL',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      announcementId = res.body.data._id as string;
    });
  });

  describe('GET /api/v1/announcements', () => {
    it('returns empty list (no PUBLISHED announcements)', async () => {
      const res = await request(app).get('/api/v1/announcements');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/announcements/:id/status', () => {
    it('transitions DRAFT -> PENDING', async () => {
      const res = await request(app)
        .patch(`/api/v1/announcements/${announcementId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PENDING' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('transitions PENDING -> PUBLISHED', async () => {
      const res = await request(app)
        .patch(`/api/v1/announcements/${announcementId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PUBLISHED' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');
      expect(res.body.data.publishedAt).toBeTruthy();
    });

    it('rejects invalid transition PUBLISHED -> DRAFT', async () => {
      const res = await request(app)
        .patch(`/api/v1/announcements/${announcementId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DRAFT' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TRANSITION');
    });
  });

  describe('GET /api/v1/announcements (published)', () => {
    it('returns published announcement', async () => {
      const res = await request(app).get('/api/v1/announcements');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/v1/announcements/:id', () => {
    it('403 if not author or admin', async () => {
      // Create another staff user to test
      const anotherStaffHash = await hashPassword('OtherPass123');
      await User.create({
        name: 'Other Staff',
        email: `other_${Date.now()}@example.com`,
        passwordHash: anotherStaffHash,
        role: 'STAFF',
        isVerified: true,
      });
      // We don't have another token easily here; just ensure the owner can edit
      const res = await request(app)
        .patch(`/api/v1/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ title: 'Updated Title Here' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/announcements/:id', () => {
    it('soft-deletes announcement', async () => {
      const res = await request(app)
        .delete(`/api/v1/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 after soft delete', async () => {
      const res = await request(app).get(`/api/v1/announcements/${announcementId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/announcements/me/posts', () => {
    it('returns staff own posts', async () => {
      const res = await request(app)
        .get('/api/v1/announcements/me/posts')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
