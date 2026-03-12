import { Acknowledgement } from '../../models/Acknowledgement.model';
import { Announcement } from '../../models/Announcement.model';
import { AppError } from '../../utils/AppError';
import { notify } from '../../utils/notifier';

export const acknowledge = async (announcementId: string, userId: string, ip?: string) => {
  const announcement = await Announcement.findOne({ _id: announcementId, deletedAt: null });
  if (!announcement) throw new AppError('Announcement not found', 404, 'NOT_FOUND');

  // Idempotent — silently succeed if already acknowledged
  const existing = await Acknowledgement.findOne({ announcementId, userId });
  if (existing) return existing;

  const ack = await Acknowledgement.create({ announcementId, userId, ipAddress: ip });

  // Notify posting staff that someone acknowledged
  const postAuthorId = String(announcement.authorId);
  if (postAuthorId !== userId) {
    await notify({
      recipientId: postAuthorId,
      announcementId,
      type: 'ACKNOWLEDGEMENT',
      message: `A student acknowledged: "${announcement.title}"`,
    });
  }

  return ack;
};

export const listAcknowledgements = async (announcementId: string) =>
  Acknowledgement.find({ announcementId })
    .sort({ acknowledgedAt: -1 })
    .populate('userId', 'name email matricNo')
    .lean();
