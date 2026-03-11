import type { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as NotificationService from './notification.service';
import type { AuthRequest } from '../../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await NotificationService.listNotifications(
    req.user!.userId,
    req.query as Record<string, unknown>
  );
  res.json({ success: true, ...result });
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await NotificationService.markAllRead(req.user!.userId);
  res.json({ success: true, data: { message: 'All notifications marked as read' } });
});

export const markOneRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await NotificationService.markOneRead(req.params['id'] as string, req.user!.userId);
  res.json({ success: true, data: { message: 'Notification marked as read' } });
});
