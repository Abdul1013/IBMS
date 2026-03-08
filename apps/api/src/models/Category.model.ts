import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  color: string;
  icon: string;
  department?: Types.ObjectId;
  isGlobal: boolean;
  isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    color: { type: String, default: '#1A56A0' },
    icon: { type: String, default: 'Bell' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    isGlobal: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', categorySchema);
