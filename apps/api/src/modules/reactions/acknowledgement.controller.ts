import type { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as AckService from './acknowledgement.service';
import type { AuthRequest } from '../../middleware/auth';

export const acknowledge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AckService.acknowledge(
    req.params['id'] as string,
    req.user!.userId,
    req.ip as string | undefined
  );
  res.json({ success: true, data });
});

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AckService.listAcknowledgements(req.params['id'] as string);
  res.json({ success: true, data });
});
