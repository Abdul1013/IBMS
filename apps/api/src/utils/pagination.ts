export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const parsePagination = (query: Record<string, unknown>): PaginationParams => ({
  page: Math.max(1, parseInt(String(query['page'] ?? 1), 10)),
  limit: Math.min(50, Math.max(1, parseInt(String(query['limit'] ?? 20), 10))),
});

export const buildMeta = (total: number, { page, limit }: PaginationParams): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
