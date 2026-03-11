import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as CommentService from './comment.service';
import type { AuthRequest } from '../../middleware/auth';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await CommentService.listComments(
    req.params['id'] as string,
    req.query as Record<string, unknown>
  );
  res.json({ success: true, ...result });
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await CommentService.createComment(
    req.params['id'] as string,
    req.user!.userId,
    req.body
  );
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await CommentService.updateComment(
    req.params['id'] as string,
    req.user!.userId,
    req.body
  );
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await CommentService.deleteComment(req.params['id'] as string, req.user!.userId, req.user!.role);
  res.json({ success: true, data: { message: 'Comment removed' } });
});
