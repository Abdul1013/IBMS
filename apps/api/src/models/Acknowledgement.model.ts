import { Schema, model, Document, Types } from 'mongoose';

export interface IAcknowledgement extends Document {
  announcementId: Types.ObjectId;
  userId: Types.ObjectId;
  acknowledgedAt: Date;
  ipAddress?: string;
}

const acknowledgementSchema = new Schema<IAcknowledgement>(
  {
    announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    acknowledgedAt: { type: Date, default: Date.now },
    ipAddress: String,
  },
  { timestamps: true }
);

acknowledgementSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

export const Acknowledgement = model<IAcknowledgement>('Acknowledgement', acknowledgementSchema);
