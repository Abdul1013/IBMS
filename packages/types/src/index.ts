// Shared between apps/api and apps/web — import as @ibms/types

export type Role = 'SYSTEM_ADMIN' | 'DEPT_ADMIN' | 'STAFF' | 'STUDENT';
export type AnnouncementStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
export type Priority = 'NORMAL' | 'HIGH' | 'URGENT';
export type ReactionType = 'LIKE' | 'HELPFUL' | 'URGENT' | 'NOTED';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { page: number; total: number; limit: number };
}

export interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  category: { id: string; name: string; color: string };
  status: AnnouncementStatus;
  priority: Priority;
  author: { id: string; name: string };
  views: number;
  publishedAt?: string;
  createdAt: string;
}
