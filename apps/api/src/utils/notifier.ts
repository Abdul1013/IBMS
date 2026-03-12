import { Notification } from '../models/Notification.model';
import { emitToRooms } from '../sockets/emitter';

interface NotifyParams {
  recipientId: string;
  announcementId?: string;
  type: string;
  message: string;
}

export const notify = async ({ recipientId, announcementId, type, message }: NotifyParams) => {
  const notification = await Notification.create({
    recipientId,
    announcementId,
    type,
    message,
    isRead: false,
  });

  // Each authenticated user has a personal Socket.IO room: "user:{userId}"
  emitToRooms([`user:${recipientId}`], 'notification:new', {
    notificationId: String(notification._id),
    message,
    type,
  });

  return notification;
};
