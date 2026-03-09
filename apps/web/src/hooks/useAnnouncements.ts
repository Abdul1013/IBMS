import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import type { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Category {
  _id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  category: Category | null;
  authorId: { _id: string; name: string; role: string } | null;
  views: number;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface ApiError {
  error: { code: string; message: string };
}

// ─── Query keys ───────────────────────────────────────────────────────────────
export const announcementKeys = {
  all: ['announcements'] as const,
  list: (params: Record<string, unknown>) => ['announcements', 'list', params] as const,
  detail: (id: string) => ['announcements', 'detail', id] as const,
  mine: (params: Record<string, unknown>) => ['announcements', 'mine', params] as const,
  categories: ['categories'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useCategories = () =>
  useQuery({
    queryKey: announcementKeys.categories,
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Category[] }>('/categories');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 10,
  });

export const useAnnouncements = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Announcement>>('/announcements', { params });
      return res.data;
    },
  });

export const useAnnouncement = (id: string) =>
  useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Announcement }>(`/announcements/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

export const useMyAnnouncements = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: announcementKeys.mine(params),
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Announcement>>('/announcements/me/posts', {
        params,
      });
      return res.data;
    },
  });

// ─── Mutations ────────────────────────────────────────────────────────────────
export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  category: string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  targetRoles?: string[];
  targetDepts?: string[];
  expiresAt?: string;
}

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation<Announcement, AxiosError<ApiError>, CreateAnnouncementPayload>({
    mutationFn: async payload => {
      const res = await api.post<{ success: boolean; data: Announcement }>(
        '/announcements',
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
};

export const useTransitionStatus = (id: string) => {
  const qc = useQueryClient();
  return useMutation<Announcement, AxiosError<ApiError>, { status: string; comment?: string }>({
    mutationFn: async payload => {
      const res = await api.patch<{ success: boolean; data: Announcement }>(
        `/announcements/${id}/status`,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
};

export interface UpdateAnnouncementPayload {
  title?: string;
  body?: string;
  category?: string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt?: string;
}

export const useUpdateAnnouncement = (id: string) => {
  const qc = useQueryClient();
  return useMutation<Announcement, AxiosError<ApiError>, UpdateAnnouncementPayload>({
    mutationFn: async payload => {
      const res = await api.patch<{ success: boolean; data: Announcement }>(
        `/announcements/${id}`,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: async (id: string) => {
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
};
