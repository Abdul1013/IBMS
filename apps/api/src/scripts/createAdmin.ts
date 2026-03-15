/* eslint-disable no-console */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User } from '../models/User.model';
import { Category } from '../models/Category.model';

// ─── Seed data
const CATEGORIES = [
  // General
  { name: 'General', color: '#1A56A0', icon: 'Bell', isGlobal: true },
  { name: 'Events', color: '#E67E22', icon: 'Calendar', isGlobal: true },
  { name: 'Emergency', color: '#E74C3C', icon: 'AlertTriangle', isGlobal: true },
  { name: 'Bursary & Finance', color: '#8B5CF6', icon: 'CreditCard', isGlobal: true },

  // Academic / Faculty
  { name: 'Academic', color: '#27AE60', icon: 'BookOpen', isGlobal: true },
  { name: 'Faculty of Engineering', color: '#0891B2', icon: 'Cpu', isGlobal: false },
  { name: 'Faculty of Sciences', color: '#059669', icon: 'FlaskConical', isGlobal: false },
  { name: 'Faculty of Law', color: '#7C3AED', icon: 'Scale', isGlobal: false },
  {
    name: 'Faculty of Medicine & Health Sciences',
    color: '#DC2626',
    icon: 'HeartPulse',
    isGlobal: false,
  },
  {
    name: 'Faculty of Business Administration',
    color: '#D97706',
    icon: 'Briefcase',
    isGlobal: false,
  },
  { name: 'Faculty of Arts & Humanities', color: '#DB2777', icon: 'Palette', isGlobal: false },
  { name: 'Faculty of Social Sciences', color: '#2563EB', icon: 'Users', isGlobal: false },

  // Departments
  { name: 'Dept — Computer Science & IT', color: '#06B6D4', icon: 'Monitor', isGlobal: false },
  { name: 'Dept — Mechanical Engineering', color: '#6366F1', icon: 'Settings', isGlobal: false },
  { name: 'Dept — Civil Engineering', color: '#78716C', icon: 'Building2', isGlobal: false },
  { name: 'Dept — Electrical Engineering', color: '#EAB308', icon: 'Zap', isGlobal: false },
  { name: 'Dept — Accounting & Finance', color: '#10B981', icon: 'PiggyBank', isGlobal: false },
  { name: 'Dept — Mass Communication', color: '#F43F5E', icon: 'Radio', isGlobal: false },
  { name: 'Dept — Pharmacy', color: '#A855F7', icon: 'Pill', isGlobal: false },
  { name: 'Dept — Nursing', color: '#EC4899', icon: 'Stethoscope', isGlobal: false },

  // Hostel / Accommodation
  { name: 'Hostel & Accommodation', color: '#F59E0B', icon: 'Home', isGlobal: false },
  { name: 'Hostel — Male Block', color: '#3B82F6', icon: 'BedDouble', isGlobal: false },
  { name: 'Hostel — Female Block', color: '#EC4899', icon: 'BedDouble', isGlobal: false },
  { name: 'Off-Campus Students', color: '#64748B', icon: 'MapPin', isGlobal: false },
];

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ─── Main
async function main() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to MongoDB');

  // ── Admin user
  const existing = await User.findOne({ email: 'trybenode@gmail.com' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('Abdul@2003', 10);
    await User.create({
      name: 'Trybe Node',
      email: 'trybenode@gmail.com',
      passwordHash,
      role: 'SYSTEM_ADMIN',
      isVerified: true,
    });
    console.log('SYSTEM_ADMIN created — trybenode@gmail.com');
  } else {
    console.log('  Admin user already exists — skipped');
  }

  // ── Categories
  let created = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const slug = toSlug(cat.name);
    const exists = await Category.findOne({ slug });
    if (exists) {
      skipped++;
      continue;
    }
    await Category.create({ ...cat, slug });
    created++;
  }

  console.log(`✓ Categories: ${created} created, ${skipped} already existed`);
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
