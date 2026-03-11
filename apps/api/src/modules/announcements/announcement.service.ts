import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Announcement } from '../../models/Announcement.model';
import { AuditLog } from '../../models/AuditLog.model';
import { redis } from '../../config/redis';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { emitToRooms } from '../../sockets/emitter';
import type {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  StatusTransitionDto,
} from './announcement.dto';

const { window } = new JSDOM('');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purify = DOMPurify(window as any);

const sanitiseBody = (html: string) =>
  purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'br', 'h2', 'h3', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target'],
  });

// ─── List (public feed) ───────────────────────────────────────────────────────
export const listAnnouncements = async (query: Record<string, unknown>) => {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, unknown> = { deletedAt: null, status: 'PUBLISHED' };

  if (query['category']) filter['category'] = query['category'];
  if (query['priority']) filter['priority'] = query['priority'];
  if (query['search']) filter['$text'] = { $search: String(query['search']) };

  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .sort(query['search'] ? { score: { $meta: 'textScore' } } : { priority: -1, publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('authorId', 'name role')
      .populate('category', 'name color icon')
      .lean(),
    Announcement.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(total, { page, limit }) };
};

// ─── Get One ──────────────────────────────────────────────────────────────────
export const getAnnouncement = async (id: string, viewerSessionKey?: string) => {
  const announcement = await Announcement.findOne({ _id: id, deletedAt: null })
    .populate('authorId', 'name role department')
    .populate('category', 'name color icon');

  if (!announcement) throw new AppError('Announcement not found', 404, 'NOT_FOUND');

  if (viewerSessionKey) {
    const viewKey = `view:${id}:${viewerSessionKey}`;
    const alreadyViewed = await redis.get(viewKey);
    if (!alreadyViewed) {
      await Announcement.findByIdAndUpdate(id, { $inc: { views: 1 } });
      await redis.setex(viewKey, 60 * 60 * 24, '1');
    }
  }

  return announcement;
};

// ─── Create ───────────────────────────────────────────────────────────────────
export const createAnnouncement = async (authorId: string, dto: CreateAnnouncementDto) => {
  const cleanBody = sanitiseBody(dto.body);
  const announcement = await Announcement.create({
    ...dto,
    body: cleanBody,
    authorId,
    status: 'DRAFT',
  });

  await AuditLog.create({
    actorId: authorId,
    action: 'CREATE',
    targetType: 'Announcement',
    targetId: announcement._id,
  });
  return announcement;
};

// ─── Update ───────────────────────────────────────────────────────────────────
export const updateAnnouncement = async (
  id: string,
  actorId: string,
  actorRole: string,
  dto: UpdateAnnouncementDto
) => {
  const announcement = await Announcement.findOne({ _id: id, deletedAt: null });
  if (!announcement) throw new AppError('Announcement not found', 404, 'NOT_FOUND');

  const isAuthor = String(announcement.authorId) === actorId;
  const isAdmin = ['SYSTEM_ADMIN', 'DEPT_ADMIN'].includes(actorRole);
  if (!isAuthor && !isAdmin)
    throw new AppError('Not authorised to edit this announcement', 403, 'FORBIDDEN');

  if (dto.body) dto.body = sanitiseBody(dto.body);

  const updated = await Announcement.findByIdAndUpdate(id, dto, { new: true });
  await AuditLog.create({ actorId, action: 'UPDATE', targetType: 'Announcement', targetId: id });
  return updated;
};

// ─── Soft Delete ──────────────────────────────────────────────────────────────
export const deleteAnnouncement = async (id: string, actorId: string, actorRole: string) => {
  const announcement = await Announcement.findOne({ _id: id, deletedAt: null });
  if (!announcement) throw new AppError('Announcement not found', 404, 'NOT_FOUND');

  const isAuthor = String(announcement.authorId) === actorId;
  const isAdmin = ['SYSTEM_ADMIN', 'DEPT_ADMIN'].includes(actorRole);
  if (!isAuthor && !isAdmin) throw new AppError('Not authorised', 403, 'FORBIDDEN');

  await Announcement.findByIdAndUpdate(id, { deletedAt: new Date() });
  await AuditLog.create({ actorId, action: 'DELETE', targetType: 'Announcement', targetId: id });
};

// ─── Status Transition ────────────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING', 'ARCHIVED'],
  PENDING: ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};

export const transitionStatus = async (id: string, actorId: string, dto: StatusTransitionDto) => {
  const announcement = await Announcement.findOne({ _id: id, deletedAt: null }).populate(
    'category',
    'name slug'
  );
  if (!announcement) throw new AppError('Announcement not found', 404, 'NOT_FOUND');

  const allowed = VALID_TRANSITIONS[announcement.status] ?? [];
  if (!allowed.includes(dto.status))
    throw new AppError(
      `Cannot transition from ${announcement.status} to ${dto.status}`,
      400,
      'INVALID_TRANSITION'
    );

  const update: Record<string, unknown> = { status: dto.status };
  if (dto.status === 'PUBLISHED') update['publishedAt'] = new Date();

  const updated = await Announcement.findByIdAndUpdate(id, update, { new: true })
    .populate('authorId', 'name')
    .populate('category', 'name slug color');

  await AuditLog.create({
    actorId,
    action: `STATUS_${dto.status}`,
    targetType: 'Announcement',
    targetId: id,
    metadata: { comment: dto.comment },
  });

  if (dto.status === 'PUBLISHED' && updated) {
    const cat = updated.category as { slug?: string };
    const rooms = ['global', `category:${cat?.slug ?? 'general'}`];
    emitToRooms(rooms, 'announcement:new', {
      id: String(updated._id),
      title: updated.title,
      category: updated.category,
      priority: updated.priority,
      author: updated.authorId,
    });
  }

  return updated;
};

// ─── Staff: list own announcements ────────────────────────────────────────────
export const listMyAnnouncements = async (authorId: string, query: Record<string, unknown>) => {
  const { page, limit } = parsePagination(query);
  const filter = { authorId, deletedAt: null };

  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name color')
      .lean(),
    Announcement.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(total, { page, limit }) };
};
