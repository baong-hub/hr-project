export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details: ApiErrorDetail[] | null;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface PagedResult<T> {
  items: T[];
  meta: PagingMeta;
}

export interface PagingMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
