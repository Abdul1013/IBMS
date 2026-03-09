import { User } from '../../models/User.model';
import { Announcement } from '../../models/Announcement.model';
import { Reaction } from '../../models/Reaction.model';
import { Comment } from '../../models/Comment.model';
import { Acknowledgement } from '../../models/Acknowledgement.model';
import { AppError } from '../../utils/AppError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { notify } from '../../utils/notifier';
import { sendApprovalEmail, sendRejectionEmail } from '../../utils/emailTemplates';
import type { Role } from '@ibms/types';

// ─── Users ────────────────────────────────────────────────────────────────────
export const listUsers = async (query: Record<string, unknown>) => {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (query['search']) {
    const regex = new RegExp(String(query['search']), 'i');
    filter['$or'] = [{ name: regex }, { email: regex }];
  }
  if (query['role']) filter['role'] = query['role'];

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { items, meta: buildMeta(total, { page, limit }) };
};

export const createUser = async (dto: {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
}) => {
  const { hashPassword } = await import('../auth/auth.service');
  const exists = await User.findOne({ email: dto.email });
  if (exists) throw new AppError('Email already in use', 409, 'EMAIL_IN_USE');
  const passwordHash = await hashPassword(dto.password);
  // admin-created = pre-verified; spread dto (password field ignored by schema), set passwordHash
  return User.create({ ...dto, passwordHash, isVerified: true });
};

export const changeRole = async (id: string, role: Role, actorId: string) => {
  if (id === actorId) throw new AppError('Cannot change your own role', 400, 'SELF_ROLE_CHANGE');
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

export const deactivateUser = async (id: string, actorId: string) => {
  if (id === actorId) throw new AppError('Cannot deactivate yourself', 400, 'SELF_DEACTIVATE');
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

// ─── Approval Queue ───────────────────────────────────────────────────────────
export const listPending = async (query: Record<string, unknown>) => {
  const { page, limit } = parsePagination(query);
  const filter = { status: 'PENDING', deletedAt: null };
  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('authorId', 'name email')
      .populate('category', 'name color')
      .lean(),
    Announcement.countDocuments(filter),
  ]);
  return { items, meta: buildMeta(total, { page, limit }) };
};

export const approveAnnouncement = async (id: string, actorId: string) => {
  void actorId; // recorded in audit log by caller

  const announcement = await Announcement.findOneAndUpdate(
    { _id: id, status: 'PENDING', deletedAt: null },
    { status: 'PUBLISHED', publishedAt: new Date() },
    { new: true }
  ).populate('authorId', 'name email');

  if (!announcement) throw new AppError('Pending announcement not found', 404, 'NOT_FOUND');

  const author = announcement.authorId as unknown as { _id: unknown; name: string; email: string };
  await sendApprovalEmail(author.email, author.name, announcement.title);
  await notify({
    recipientId: String(author._id),
    announcementId: String(announcement._id),
    type: 'APPROVED',
    message: `Your announcement "${announcement.title}" has been approved and published.`,
  });

  return announcement;
};

export const rejectAnnouncement = async (id: string, actorId: string, reason: string) => {
  void actorId;

  const announcement = await Announcement.findOneAndUpdate(
    { _id: id, status: 'PENDING', deletedAt: null },
    { status: 'DRAFT' },
    { new: true }
  ).populate('authorId', 'name email');

  if (!announcement) throw new AppError('Pending announcement not found', 404, 'NOT_FOUND');

  const author = announcement.authorId as unknown as { _id: unknown; name: string; email: string };
  await sendRejectionEmail(author.email, author.name, announcement.title, reason);
  await notify({
    recipientId: String(author._id),
    announcementId: String(announcement._id),
    type: 'REJECTED',
    message: `Your announcement "${announcement.title}" was returned: ${reason}`,
  });

  return announcement;
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalytics = async () => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    totalAnnouncements,
    totalUsers,
    totalReactions,
    totalComments,
    totalAcks,
    categoryBreakdown,
    recentEngagement,
  ] = await Promise.all([
    Announcement.countDocuments({ status: 'PUBLISHED', deletedAt: null }),
    User.countDocuments({ isActive: true, deletedAt: null }),
    Reaction.countDocuments(),
    Comment.countDocuments({ deletedAt: null }),
    Acknowledgement.countDocuments(),
    Announcement.aggregate([
      { $match: { status: 'PUBLISHED', deletedAt: null } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $project: { name: '$cat.name', color: '$cat.color', count: 1 } },
    ]),
    Announcement.aggregate([
      { $match: { status: 'PUBLISHED', publishedAt: { $gte: since }, deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    summary: { totalAnnouncements, totalUsers, totalReactions, totalComments, totalAcks },
    categoryBreakdown,
    recentEngagement,
  };
};
