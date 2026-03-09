import { Router } from 'express';
import { z } from 'zod';
import * as AdminController from './admin.controller';
import { verifyToken, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
router.use(verifyToken);

// User management — SYSTEM_ADMIN only
router.get('/users', requireRole('SYSTEM_ADMIN'), AdminController.listUsers);
router.post('/users', requireRole('SYSTEM_ADMIN'), AdminController.createUser);
router.patch(
  '/users/:id/role',
  requireRole('SYSTEM_ADMIN'),
  validate(z.object({ role: z.enum(['SYSTEM_ADMIN', 'DEPT_ADMIN', 'STAFF', 'STUDENT']) })),
  AdminController.changeRole
);
router.patch('/users/:id/deactivate', requireRole('SYSTEM_ADMIN'), AdminController.deactivate);

// Approval queue — DEPT_ADMIN+
router.get('/pending', requireRole('DEPT_ADMIN', 'SYSTEM_ADMIN'), AdminController.listPending);
router.post(
  '/pending/:id/approve',
  requireRole('DEPT_ADMIN', 'SYSTEM_ADMIN'),
  AdminController.approve
);
router.post(
  '/pending/:id/reject',
  requireRole('DEPT_ADMIN', 'SYSTEM_ADMIN'),
  validate(z.object({ reason: z.string().min(1).max(500) })),
  AdminController.reject
);

// Analytics — DEPT_ADMIN+
router.get('/analytics', requireRole('DEPT_ADMIN', 'SYSTEM_ADMIN'), AdminController.analytics);

export default router;
