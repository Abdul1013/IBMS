import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(60).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex colour')
    .default('#1A56A0'),
  icon: z.string().max(50).default('Bell'),
  isGlobal: z.boolean().default(true),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
