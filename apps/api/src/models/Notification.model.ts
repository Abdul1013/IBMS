import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  announcementId?: Types.ObjectId;
  type: string;
  message: string;
  isRead: boolean;
  deliveryChannel: string;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement' },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    deliveryChannel: { type: String, default: 'in-app' },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
// Auto-expire notifications after 90 days to prevent unbounded growth
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const Notification = model<INotification>('Notification', notificationSchema);
