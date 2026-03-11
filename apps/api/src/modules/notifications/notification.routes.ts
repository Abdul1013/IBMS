import { Router } from 'express';
import * as NotificationController from './notification.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router();
router.use(verifyToken);
router.get('/', NotificationController.list);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', NotificationController.markOneRead);
export default router;
