import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  // Never retry 4xx client errors — they won't resolve on their own
  const status = (error as AxiosError)?.response?.status;
  if (status && status >= 400 && status < 500) return false;
  // Retry up to 2 times for network failures or 5xx
  return failureCount < 2;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min before background refetch
      gcTime: 1000 * 60 * 10, // 10 min in-memory cache after component unmounts
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // mutations are not idempotent — never auto-retry
    },
  },
});
