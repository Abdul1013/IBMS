import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  ip?: string;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: Schema.Types.ObjectId,
    metadata: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true }
);

auditLogSchema.set('strict', true);
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
