export interface PaginationMeta {
  requestId: string;
  nextCursor?: string | null;
  hasMore?: boolean;
  totalCount?: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta: PaginationMeta;
}

export interface ApiFieldError {
  [field: string]: string[];
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: ApiFieldError;
  requestId: string;
}

export interface ApiError {
  error: ApiErrorPayload;
}

