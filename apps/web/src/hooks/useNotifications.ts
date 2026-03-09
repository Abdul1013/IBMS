import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/axios';
import { useNotificationStore } from '../stores/notificationStore';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../stores/authStore';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { increment, setCount } = useNotificationStore();
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; items: unknown[]; meta: { total: number } }>(
        '/notifications'
      );
      setCount(res.data.meta?.total ?? 0);
      return res.data;
    },
    enabled: !!user,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setCount(0);
    },
  });

  // Listen for new notifications over Socket.IO
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handler = () => {
      increment();
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [user, increment, queryClient]);

  return { ...query, markAllRead };
};
