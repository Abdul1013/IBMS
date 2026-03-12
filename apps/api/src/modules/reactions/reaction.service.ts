import { Reaction } from '../../models/Reaction.model';
import { emitToRooms } from '../../sockets/emitter';
import type { ToggleReactionDto } from './reaction.dto';

// Returns all reaction counts + which types the current user has active
export const getReactions = async (announcementId: string, userId?: string) => {
  const all = await Reaction.find({ announcementId }).lean();

  const counts: Record<string, number> = { LIKE: 0, HELPFUL: 0, URGENT: 0, NOTED: 0 };
  const mine: string[] = [];

  for (const r of all) {
    counts[r.type] = (counts[r.type] ?? 0) + 1;
    if (userId && String(r.userId) === userId) mine.push(r.type);
  }

  return { counts, mine };
};

// Toggle — add if absent, remove if present; returns updated counts
export const toggleReaction = async (
  announcementId: string,
  userId: string,
  dto: ToggleReactionDto
) => {
  const existing = await Reaction.findOne({ announcementId, userId, type: dto.type });

  if (existing) {
    await Reaction.deleteOne({ _id: existing._id });
  } else {
    await Reaction.create({ announcementId, userId, type: dto.type });
  }

  const result = await getReactions(announcementId, userId);

  // Emit to everyone viewing this announcement
  emitToRooms([`announcement:${announcementId}`], 'reaction:update', {
    announcementId,
    reactionCounts: result.counts,
  });

  return result;
};
