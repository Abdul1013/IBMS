import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
  unreadCount: number;
  increment: () => void;
  reset: () => void;
  setCount: (n: number) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    set => ({
      unreadCount: 0,
      increment: () => set(s => ({ unreadCount: s.unreadCount + 1 })),
      reset: () => set({ unreadCount: 0 }),
      setCount: n => set({ unreadCount: n }),
    }),
    { name: 'ibms-notifications' }
  )
);
