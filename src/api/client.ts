import type { ApiError, RequestOptions } from '@/types/api';
import { API_BASE_URL } from '@/config/urls';

// Token getter type
type TokenGetter = () => string | null;

// Locale getter type
type LocaleGetter = () => 'EN' | 'DE';

// Global token getter - will be set by AuthContext
let globalGetAccessToken: TokenGetter = () => null;

// Global locale getter - will be set by LocaleProvider
let globalGetLocale: LocaleGetter = () => 'EN';

export function setTokenGetter(getter: TokenGetter): void {
  globalGetAccessToken = getter;
}

export function setLocaleGetter(getter: LocaleGetter): void {
  globalGetLocale = getter;
}

export function getLocale() {
  return globalGetLocale();
}

// Type-safe API client
async function request<TResponse, TBody = undefined>(
  endpoint: string,
  options: RequestOptions<TBody>,
  responseType?: 'blob' | 'json'
): Promise<TResponse> {
  const { method, body, headers = {}, requiresAuth = false, signal } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': globalGetLocale(),
    ...headers,
  };

  // Add authorization header if required
  if (requiresAuth) {
    const token = globalGetAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    signal,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle no content responses
  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (response.status === 401) {
    const error: ApiError = {
      message: "Unauthorized",
      statusCode: response.status,
    };
    throw error;
  }

  const data: unknown = responseType === 'blob' ? await response.blob() : await response.json();

  if (!response.ok) {
    const error: ApiError = {
      message: (data as { message?: string }).message || 'An error occurred',
      statusCode: response.status,
      error: (data as { error?: string }).error,
    };
    throw error;
  }



  return data as TResponse;
}

// API client with typed methods
export const apiClient = {
  get<TResponse>(endpoint: string, requiresAuth = false, responseType?: 'blob' | 'json'): Promise<TResponse> {
    return request<TResponse>(endpoint, { method: 'GET', requiresAuth }, responseType);
  },

  post<TResponse, TBody>(
    endpoint: string,
    body: TBody,
    requiresAuth = false
  ): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, {
      method: 'POST',
      body,
      requiresAuth,
    });
  },

  put<TResponse, TBody>(
    endpoint: string,
    body: TBody,
    requiresAuth = false
  ): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, {
      method: 'PUT',
      body,
      requiresAuth,
    });
  },

  delete<TResponse>(endpoint: string, requiresAuth = false): Promise<TResponse> {
    return request<TResponse>(endpoint, { method: 'DELETE', requiresAuth });
  },

  patch<TResponse, TBody>(
    endpoint: string,
    body: TBody,
    requiresAuth = false
  ): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, {
      method: 'PATCH',
      body,
      requiresAuth,
    });
  },
};
