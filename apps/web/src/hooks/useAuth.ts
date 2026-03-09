import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/axios';
import type { Role } from '@ibms/types';

const ROLE_REDIRECT: Record<Role, string> = {
  SYSTEM_ADMIN: '/admin',
  DEPT_ADMIN: '/post',
  STAFF: '/post',
  STUDENT: '/feed',
};

export const useAuth = () => {
  const { user, accessToken, setAuth, clearAuth, isHydrated } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken: token, user: me } = data.data;
    setAuth(me, token);
    navigate(ROLE_REDIRECT[me.role as Role] ?? '/feed');
  };

  const register = async (payload: Record<string, string>) => {
    await api.post('/auth/register', payload);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear local state regardless
    }
    clearAuth();
    navigate('/login');
  };

  const isAuthenticated = !!user && !!accessToken;

  return { user, isAuthenticated, isHydrated, login, register, logout };
};
