import { Schema, model, Document, Types } from 'mongoose';

export type Role = 'SYSTEM_ADMIN' | 'DEPT_ADMIN' | 'STAFF' | 'STUDENT';
export type HostelStatus = 'ON_CAMPUS' | 'OFF_CAMPUS';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  department?: Types.ObjectId;
  faculty?: string;
  hostel?: HostelStatus;
  notifyCategories?: Types.ObjectId[];
  matricNo?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  deletedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['SYSTEM_ADMIN', 'DEPT_ADMIN', 'STAFF', 'STUDENT'],
      required: true,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Category' },
    faculty: { type: String, trim: true },
    hostel: { type: String, enum: ['ON_CAMPUS', 'OFF_CAMPUS'] },
    notifyCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    matricNo: { type: String, sparse: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ deletedAt: 1 }, { sparse: true });

export const User = model<IUser>('User', userSchema);
