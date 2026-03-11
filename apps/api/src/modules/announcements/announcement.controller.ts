import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { upload, uploadToCloudinary } from '../../middleware/upload';
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  transitionStatus,
  listMyAnnouncements,
} from './announcement.service';
import type {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  StatusTransitionDto,
} from './announcement.dto';
import { Announcement } from '../../models/Announcement.model';
import { AppError } from '../../utils/AppError';

// ─── Public ───────────────────────────────────────────────────────────────────
export const listHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listAnnouncements(req.query as Record<string, unknown>);
  res.json({ success: true, ...data });
});

export const getOneHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessionKey = req.cookies['session_id'] as string | undefined;
  const data = await getAnnouncement(req.params['id'] as string, sessionKey);
  res.json({ success: true, data });
});

// ─── Staff / Admin ────────────────────────────────────────────────────────────
export const createHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dto = req.body as CreateAnnouncementDto;
  const announcement = await createAnnouncement(req.user!.userId, dto);

  // Handle file attachments if uploaded via multipart
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const uploads = await Promise.all(
      (req.files as Express.Multer.File[]).map(f => uploadToCloudinary(f.buffer, f.mimetype))
    );
    const attachments = uploads.map((u, i) => ({
      url: u.url,
      publicId: u.publicId,
      filename: (req.files as Express.Multer.File[])[i]!.originalname,
      mimetype: (req.files as Express.Multer.File[])[i]!.mimetype,
      bytes: u.bytes,
    }));
    await Announcement.findByIdAndUpdate(announcement._id, { attachments });
  }

  res.status(201).json({ success: true, data: announcement });
});

export const updateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dto = req.body as UpdateAnnouncementDto;
  const data = await updateAnnouncement(
    req.params['id'] as string,
    req.user!.userId,
    req.user!.role,
    dto
  );
  res.json({ success: true, data });
});

export const deleteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deleteAnnouncement(req.params['id'] as string, req.user!.userId, req.user!.role);
  res.status(204).send();
});

export const transitionHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dto = req.body as StatusTransitionDto;
  const data = await transitionStatus(req.params['id'] as string, req.user!.userId, dto);
  res.json({ success: true, data });
});

export const myPostsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listMyAnnouncements(req.user!.userId, req.query as Record<string, unknown>);
  res.json({ success: true, ...data });
});

// ─── Upload attachment to existing announcement ───────────────────────────────
export const uploadAttachmentHandler = [
  upload.array('files', 5),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const announcement = await Announcement.findOne({ _id: id, deletedAt: null });
    if (!announcement) throw new AppError('Announcement not found', 404, 'NOT_FOUND');

    const isAuthor = String(announcement.authorId) === req.user!.userId;
    const isAdmin = ['SYSTEM_ADMIN', 'DEPT_ADMIN'].includes(req.user!.role);
    if (!isAuthor && !isAdmin) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) throw new AppError('No files provided', 400, 'NO_FILES');

    const uploads = await Promise.all(files.map(f => uploadToCloudinary(f.buffer, f.mimetype)));
    const newAttachments = uploads.map((u, i) => ({
      url: u.url,
      publicId: u.publicId,
      filename: files[i]!.originalname,
      mimetype: files[i]!.mimetype,
      bytes: u.bytes,
    }));

    await Announcement.findByIdAndUpdate(id, { $push: { attachments: { $each: newAttachments } } });
    res.json({ success: true, data: newAttachments });
  }),
];
