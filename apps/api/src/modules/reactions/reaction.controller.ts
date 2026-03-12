import type { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as ReactionService from './reaction.service';
import type { AuthRequest } from '../../middleware/auth';

export const get = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await ReactionService.getReactions(req.params['id'] as string, req.user?.userId);
  res.json({ success: true, data });
});

export const toggle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await ReactionService.toggleReaction(
    req.params['id'] as string,
    req.user!.userId,
    req.body
  );
  res.json({ success: true, data });
});
