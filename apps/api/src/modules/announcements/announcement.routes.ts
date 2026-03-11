import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { publicLimiter, postingLimiter } from '../../middleware/rateLimiter';
import { CreateCategorySchema, UpdateCategorySchema } from './category.dto';
import {
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
  StatusTransitionSchema,
} from './announcement.dto';
import {
  list as listCategories,
  create as createCategory,
  update as updateCategory,
  remove as removeCategory,
} from './category.controller';
import {
  listHandler,
  getOneHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  transitionHandler,
  myPostsHandler,
  uploadAttachmentHandler,
} from './announcement.controller';
import * as ReactionController from '../reactions/reaction.controller';
import * as CommentController from '../comments/comment.controller';
import * as AckController from '../reactions/acknowledgement.controller';
import { ToggleReactionSchema } from '../reactions/reaction.dto';
import { CreateCommentSchema } from '../comments/comment.dto';

// ─── Category Router ──────────────────────────────────────────────────────────
export const categoryRouter = Router();

categoryRouter.get('/', publicLimiter, listCategories);
categoryRouter.post(
  '/',
  verifyToken,
  requireRole('SYSTEM_ADMIN'),
  validate(CreateCategorySchema),
  createCategory
);
categoryRouter.patch(
  '/:id',
  verifyToken,
  requireRole('SYSTEM_ADMIN'),
  validate(UpdateCategorySchema),
  updateCategory
);
categoryRouter.delete('/:id', verifyToken, requireRole('SYSTEM_ADMIN'), removeCategory);

// ─── Announcement Router ──────────────────────────────────────────────────────
export const announcementRouter = Router();

// Public
announcementRouter.get('/', publicLimiter, listHandler);
announcementRouter.get('/:id', publicLimiter, getOneHandler);

// Staff — own posts
announcementRouter.get(
  '/me/posts',
  verifyToken,
  requireRole('STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN'),
  myPostsHandler
);

// Staff — create / edit
announcementRouter.post(
  '/',
  verifyToken,
  requireRole('STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN'),
  postingLimiter,
  validate(CreateAnnouncementSchema),
  createHandler
);

announcementRouter.patch(
  '/:id',
  verifyToken,
  requireRole('STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN'),
  validate(UpdateAnnouncementSchema),
  updateHandler
);

announcementRouter.delete(
  '/:id',
  verifyToken,
  requireRole('STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN'),
  deleteHandler
);

// Admin — status transitions
announcementRouter.patch(
  '/:id/status',
  verifyToken,
  requireRole('DEPT_ADMIN', 'SYSTEM_ADMIN'),
  validate(StatusTransitionSchema),
  transitionHandler
);

// File attachments
announcementRouter.post(
  '/:id/attachments',
  verifyToken,
  requireRole('STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN'),
  ...uploadAttachmentHandler
);

// ─── Reactions ────────────────────────────────────────────────────────────────
announcementRouter.get('/:id/reactions', publicLimiter, ReactionController.get);
announcementRouter.post(
  '/:id/reactions',
  verifyToken,
  requireRole('STUDENT', 'STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN'),
  validate(ToggleReactionSchema),
  ReactionController.toggle
);

// ─── Acknowledgements ─────────────────────────────────────────────────────────
announcementRouter.post(
  '/:id/acknowledge',
  verifyToken,
  requireRole('STUDENT'),
  AckController.acknowledge
);
announcementRouter.get(
  '/:id/acknowledgements',
  verifyToken,
  requireRole('STAFF', 'DEPT_ADMIN', 'SYSTEM_ADMIN'),
  AckController.list
);

// ─── Comments ─────────────────────────────────────────────────────────────────
announcementRouter.get('/:id/comments', publicLimiter, CommentController.list);
announcementRouter.post(
  '/:id/comments',
  verifyToken,
  validate(CreateCommentSchema),
  CommentController.create
);
