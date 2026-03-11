import { Comment } from '../../models/Comment.model';
import { Announcement } from '../../models/Announcement.model';
import { AppError } from '../../utils/AppError';
import { emitToRooms } from '../../sockets/emitter';
import { notify } from '../../utils/notifier';
import { parsePagination, buildMeta } from '../../utils/pagination';
import type { CreateCommentDto, UpdateCommentDto } from './comment.dto';

export const listComments = async (
  announcementId: string,
  query: Record<string, unknown>
): Promise<{ items: unknown[]; meta: unknown }> => {
  const { page, limit } = parsePagination(query);

  // Fetch top-level comments only; replies are nested client-side
  const filter = { announcementId, parentId: null, deletedAt: null };
  const [topLevel, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('authorId', 'name role')
      .lean(),
    Comment.countDocuments(filter),
  ]);

  // Fetch all replies for these top-level comments in one query
  const parentIds = topLevel.map(c => c._id);
  const replies = await Comment.find({ parentId: { $in: parentIds }, deletedAt: null })
    .sort({ createdAt: 1 })
    .populate('authorId', 'name role')
    .lean();

  // Attach replies to their parents
  const replyMap = new Map<string, typeof replies>();
  for (const r of replies) {
    const key = String(r.parentId);
    if (!replyMap.has(key)) replyMap.set(key, []);
    replyMap.get(key)!.push(r);
  }

  const threads = topLevel.map(c => ({ ...c, replies: replyMap.get(String(c._id)) ?? [] }));
  return { items: threads, meta: buildMeta(total, { page, limit }) };
};

export const createComment = async (
  announcementId: string,
  authorId: string,
  dto: CreateCommentDto
) => {
  const announcement = await Announcement.findOne({ _id: announcementId, deletedAt: null });
  if (!announcement) throw new AppError('Announcement not found', 404, 'NOT_FOUND');

  const comment = await Comment.create({
    announcementId,
    authorId,
    body: dto.body,
    parentId: dto.parentId ?? null,
  });
  const populated = await comment.populate('authorId', 'name role');

  // Emit real-time to everyone viewing this announcement
  emitToRooms([`announcement:${announcementId}`], 'comment:new', {
    announcementId,
    comment: populated,
  });

  // Notify announcement author (if not self-commenting)
  const postAuthorId = String(announcement.authorId);
  if (postAuthorId !== authorId) {
    await notify({
      recipientId: postAuthorId,
      announcementId,
      type: 'COMMENT',
      message: `Someone commented on your announcement: "${announcement.title}"`,
    });
  }

  return populated;
};

export const updateComment = async (id: string, actorId: string, dto: UpdateCommentDto) => {
  const comment = await Comment.findOne({ _id: id, deletedAt: null });
  if (!comment) throw new AppError('Comment not found', 404, 'NOT_FOUND');
  if (String(comment.authorId) !== actorId)
    throw new AppError('Not your comment', 403, 'FORBIDDEN');

  return Comment.findByIdAndUpdate(id, { body: dto.body, isEdited: true }, { new: true }).populate(
    'authorId',
    'name role'
  );
};

export const deleteComment = async (id: string, actorId: string, actorRole: string) => {
  const comment = await Comment.findOne({ _id: id, deletedAt: null });
  if (!comment) throw new AppError('Comment not found', 404, 'NOT_FOUND');

  const isAuthor = String(comment.authorId) === actorId;
  const isAdmin = ['SYSTEM_ADMIN', 'DEPT_ADMIN'].includes(actorRole);
  if (!isAuthor && !isAdmin) throw new AppError('Not authorised', 403, 'FORBIDDEN');

  // Tombstone — preserve thread structure, hide body
  await Comment.findByIdAndUpdate(id, { deletedAt: new Date(), body: '[Comment removed]' });
};
