import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/axios';
import { getSocket } from '../lib/socket';

interface ReactionData {
  counts: Record<string, number>;
  mine: string[];
}

export const useReactions = (announcementId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reactions', announcementId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ReactionData }>(
        `/announcements/${announcementId}/reactions`
      );
      return res.data.data;
    },
    enabled: !!announcementId,
  });

  const toggle = useMutation({
    mutationFn: (type: string) => api.post(`/announcements/${announcementId}/reactions`, { type }),
    // Optimistic update
    onMutate: async (type: string) => {
      await queryClient.cancelQueries({ queryKey: ['reactions', announcementId] });
      const previous = queryClient.getQueryData<ReactionData>(['reactions', announcementId]);
      queryClient.setQueryData<ReactionData>(['reactions', announcementId], old => {
        if (!old) return old;
        const isActive = old.mine.includes(type);
        return {
          counts: { ...old.counts, [type]: (old.counts[type] ?? 0) + (isActive ? -1 : 1) },
          mine: isActive ? old.mine.filter(t => t !== type) : [...old.mine, type],
        };
      });
      return { previous };
    },
    onError: (_err, _type, ctx) => {
      queryClient.setQueryData(['reactions', announcementId], ctx?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['reactions', announcementId] });
    },
  });

  // Live updates from other users
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:room', { room: `announcement:${announcementId}` });

    const handler = (payload: {
      announcementId: string;
      reactionCounts: Record<string, number>;
    }) => {
      if (payload.announcementId === announcementId) {
        queryClient.setQueryData<ReactionData>(['reactions', announcementId], old =>
          old ? { ...old, counts: payload.reactionCounts } : old
        );
      }
    };
    socket.on('reaction:update', handler);

    return () => {
      socket.off('reaction:update', handler);
      socket.emit('leave:room', { room: `announcement:${announcementId}` });
    };
  }, [announcementId, queryClient]);

  return { ...query, toggle };
};
