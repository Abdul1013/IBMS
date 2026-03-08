import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  announcementId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  parentId?: Types.ObjectId;
  isEdited: boolean;
  deletedAt?: Date;
}

const commentSchema = new Schema<IComment>(
  {
    announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 2000 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    isEdited: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

commentSchema.index({ announcementId: 1, createdAt: -1 });

export const Comment = model<IComment>('Comment', commentSchema);
