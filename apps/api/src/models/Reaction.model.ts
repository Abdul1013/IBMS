import { Schema, model, Document, Types } from 'mongoose';

export type ReactionType = 'LIKE' | 'HELPFUL' | 'URGENT' | 'NOTED';

export interface IReaction extends Document {
  announcementId: Types.ObjectId;
  userId: Types.ObjectId;
  type: ReactionType;
}

const reactionSchema = new Schema<IReaction>(
  {
    announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['LIKE', 'HELPFUL', 'URGENT', 'NOTED'], required: true },
  },
  { timestamps: true }
);

reactionSchema.index({ announcementId: 1, userId: 1, type: 1 }, { unique: true });

export const Reaction = model<IReaction>('Reaction', reactionSchema);
