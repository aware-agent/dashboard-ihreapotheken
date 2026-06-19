import { useQuery } from '@tanstack/react-query';
import { bffActionsApi } from '@/api/bffActions';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { createQueryKeys } from '@/lib/queryKeys';
import type { BffActionsResponse } from '@/types/actions';
import type { ApiError } from '@/types/api';
import { useCookies } from './useCookies';

// Query keys for actions (legacy export for compatibility)
export const actionsKeys = {
  all: ['actions'] as const,
  byResult: (resultId: string) => [...actionsKeys.all, 'result', resultId] as const,
};

interface UseActionsOptions {
  enabled?: boolean;
}

// Hook for fetching personalized actions
export function useActions(resultId: string | undefined, options?: UseActionsOptions) {
  const { isAuthenticated } = useCookies();
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<BffActionsResponse, ApiError>({
    queryKey: queryKeys.actions.byResult(resultId || ''),
    queryFn: async () => {
      if (!resultId) {
        throw new Error('Result ID is required');
      }
      return bffActionsApi.getActions(resultId);
    },
    enabled: (isAuthenticated() || import.meta.env.VITE_LOCAL === 'true') && !!resultId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
