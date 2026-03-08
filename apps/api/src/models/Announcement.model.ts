import { Schema, model, Document, Types } from 'mongoose';

export type AnnouncementStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
export type Priority = 'NORMAL' | 'HIGH' | 'URGENT';

interface Attachment {
  url: string;
  filename: string;
  size: number;
}

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  authorId: Types.ObjectId;
  category: Types.ObjectId;
  status: AnnouncementStatus;
  priority: Priority;
  attachments: Attachment[];
  targetRoles: string[];
  targetDepts: Types.ObjectId[];
  views: number;
  publishedAt?: Date;
  expiresAt?: Date;
  deletedAt?: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, maxlength: 200, trim: true },
    body: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    priority: { type: String, enum: ['NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
    attachments: [{ url: String, filename: String, size: Number }],
    targetRoles: [{ type: String, enum: ['STUDENT', 'STAFF', 'ALL'] }],
    targetDepts: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    views: { type: Number, default: 0 },
    publishedAt: Date,
    expiresAt: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ category: 1, status: 1 });
announcementSchema.index({ authorId: 1, status: 1, createdAt: -1 }); // MyPosts query
announcementSchema.index({ expiresAt: 1 }, { sparse: true }); // archiver job
announcementSchema.index({ title: 'text', body: 'text' });

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
