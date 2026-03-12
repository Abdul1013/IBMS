import { z } from 'zod';

export const ToggleReactionSchema = z.object({
  type: z.enum(['LIKE', 'HELPFUL', 'URGENT', 'NOTED']),
});

export type ToggleReactionDto = z.infer<typeof ToggleReactionSchema>;
