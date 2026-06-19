import type { ApiError } from '@/types/api';
import { BFF_BASE_URL } from '@/config/urls';

// Token getter type
type TokenGetter = () => string | null;

// Import the global token getter from apiClient
import { getLocale, setTokenGetter } from './client';

// We reuse the same token getter pattern
let globalGetAccessToken: TokenGetter = () => null;

export function setBffTokenGetter(getter: TokenGetter): void {
  globalGetAccessToken = getter;
}

// BFF API client for requests to the BFF service
export const bffApiClient = {
  async get<TResponse>(endpoint: string, requiresAuth = false): Promise<TResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Language': getLocale(),
    };

    if (requiresAuth) {
      const token = globalGetAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${BFF_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers
    });

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

    const data: unknown = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: (data as { message?: string }).message || 'An error occurred',
        statusCode: response.status,
        error: (data as { error?: string }).error,
      };
      throw error;
    }

    return data as TResponse;
  },
};

// Re-export the setter for consistency
export { setTokenGetter };
