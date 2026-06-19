import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/api/results';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { createQueryKeys } from '@/lib/queryKeys';
import type { ApiError } from '@/types/api';
import type { ResultsQueryParams, ResultsResponse } from '@/types/results';
import { useCookies } from './useCookies';

// Query keys for results (legacy export for compatibility)
export const resultsKeys = {
  all: ['results'] as const,
  list: (params?: ResultsQueryParams) => [...resultsKeys.all, 'list', params] as const,
};

// Hook for fetching all results
export function useResults(params?: ResultsQueryParams) {
  const { isAuthenticated } = useCookies();
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<ResultsResponse, ApiError>({
    queryKey: queryKeys.results.list(params),
    queryFn: () => resultsApi.getAll(params),
    enabled: isAuthenticated() || import.meta.env.VITE_LOCAL === 'true',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for fetching results filtered by biomarker code
export function useResultsByBiomarker(code: string) {
  return useResults({ code });
}
