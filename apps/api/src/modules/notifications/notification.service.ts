import { Notification } from '../../models/Notification.model';
import { parsePagination, buildMeta } from '../../utils/pagination';

export const listNotifications = async (recipientId: string, query: Record<string, unknown>) => {
  const { page, limit } = parsePagination(query);
  const filter = { recipientId, isRead: false };

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('announcementId', 'title')
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(total, { page, limit }) };
};

export const markAllRead = (recipientId: string) =>
  Notification.updateMany({ recipientId, isRead: false }, { isRead: true });

export const markOneRead = async (id: string, recipientId: string) => {
  const n = await Notification.findOne({ _id: id, recipientId });
  if (!n) return;
  await Notification.findByIdAndUpdate(id, { isRead: true });
};

export const getUnreadCount = (recipientId: string) =>
  Notification.countDocuments({ recipientId, isRead: false });
