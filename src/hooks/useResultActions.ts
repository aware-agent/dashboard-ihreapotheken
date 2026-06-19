import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/api/results';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { createQueryKeys } from '@/lib/queryKeys';
import { useCookies } from './useCookies';

export function useResultActions(resultId: string | undefined) {
  const { clearAuthCookies, isAuthenticated } = useCookies();
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery({
    queryKey: queryKeys.resultActions.byResult(resultId || ''),
    queryFn: async () => {
      if (!resultId) throw new Error('Result ID is required');
      try {
        return await resultsApi.getActions(resultId);
      } catch (error: unknown) {
        throw error;
      }
    },
    enabled: !!resultId && isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
