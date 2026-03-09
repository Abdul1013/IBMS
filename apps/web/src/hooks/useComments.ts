import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/axios';
import { getSocket } from '../lib/socket';

export const useComments = (announcementId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', announcementId],
    queryFn: async () => {
      const res = await api.get(`/announcements/${announcementId}/comments`);
      return res.data as { items: unknown[]; meta: { total: number } };
    },
    enabled: !!announcementId,
  });

  const post = useMutation({
    mutationFn: (body: { body: string; parentId?: string }) =>
      api.post(`/announcements/${announcementId}/comments`, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['comments', announcementId] }),
  });

  const edit = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.patch(`/comments/${id}`, { body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['comments', announcementId] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/comments/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['comments', announcementId] }),
  });

  // Live new comments from other users
  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: { announcementId: string }) => {
      if (payload.announcementId === announcementId)
        void queryClient.invalidateQueries({ queryKey: ['comments', announcementId] });
    };
    socket.on('comment:new', handler);
    return () => {
      socket.off('comment:new', handler);
    };
  }, [announcementId, queryClient]);

  return { ...query, post, edit, remove };
};
