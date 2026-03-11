import { z } from 'zod';

export const CreateCommentSchema = z.object({
  body: z.string().min(1).max(2000).trim(),
  parentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
});

export const UpdateCommentSchema = z.object({
  body: z.string().min(1).max(2000).trim(),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;
