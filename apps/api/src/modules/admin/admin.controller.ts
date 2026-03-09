import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as AdminService from './admin.service';
import type { AuthRequest } from '../../middleware/auth';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await AdminService.listUsers(req.query as Record<string, unknown>);
  res.json({ success: true, ...result });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await AdminService.createUser(req.body);
  res.status(201).json({ success: true, data });
});

export const changeRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AdminService.changeRole(
    req.params['id'] as string,
    req.body.role,
    req.user!.userId
  );
  res.json({ success: true, data });
});

export const deactivate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AdminService.deactivateUser(req.params['id'] as string, req.user!.userId);
  res.json({ success: true, data });
});

export const listPending = asyncHandler(async (req: Request, res: Response) => {
  const result = await AdminService.listPending(req.query as Record<string, unknown>);
  res.json({ success: true, ...result });
});

export const approve = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AdminService.approveAnnouncement(req.params['id'] as string, req.user!.userId);
  res.json({ success: true, data });
});

export const reject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AdminService.rejectAnnouncement(
    req.params['id'] as string,
    req.user!.userId,
    req.body.reason
  );
  res.json({ success: true, data });
});

export const analytics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await AdminService.getAnalytics();
  res.json({ success: true, data });
});
