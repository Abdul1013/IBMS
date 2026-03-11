import { z } from 'zod';

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(5).max(200).trim(),
  body: z.string().min(10),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID'),
  priority: z.enum(['NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  targetRoles: z.array(z.enum(['STUDENT', 'STAFF', 'ALL'])).default(['ALL']),
  targetDepts: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial();

export const StatusTransitionSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED']),
  comment: z.string().max(500).optional(),
});

export type CreateAnnouncementDto = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementDto = z.infer<typeof UpdateAnnouncementSchema>;
export type StatusTransitionDto = z.infer<typeof StatusTransitionSchema>;
