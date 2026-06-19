// Generic API error response
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Type guard for API errors
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'statusCode' in error
  );
}

// Request configuration options
export interface RequestConfig {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  requiresAuth?: boolean;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request options for the API client
export interface RequestOptions<TBody = unknown> extends RequestConfig {
  method: HttpMethod;
  body?: TBody;
}
