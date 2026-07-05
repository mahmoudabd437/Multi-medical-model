export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
};

export type PaginatedResponse<T> = {
  items: T[];
  count: number;
  filters?: Record<string, unknown>;
};
