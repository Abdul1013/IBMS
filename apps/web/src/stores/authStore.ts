import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@ibms/types';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      accessToken: null,
      isHydrated: false,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setToken: accessToken => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'ibms-auth',
      partialize: state => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => state => state?.setHydrated(),
    }
  )
);
