import { useQuery } from '@tanstack/react-query';
import { healthZonesApi } from '@/api/healthZones';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { createQueryKeys } from '@/lib/queryKeys';
import type { ApiError } from '@/types/api';
import type { HealthZonesResponse } from '@/types/healthZones';
import { useCookies } from './useCookies';

// Query keys for health zones (legacy export for compatibility)
export const healthZonesKeys = {
  all: ['healthZones'] as const,
  list: () => [...healthZonesKeys.all, 'list'] as const,
};

// Hook for fetching all health zones
export function useHealthZones() {
  const { isAuthenticated } = useCookies();
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<HealthZonesResponse, ApiError>({
    queryKey: queryKeys.healthZones.list(),
    queryFn: healthZonesApi.getAll,
    enabled: isAuthenticated() || import.meta.env.VITE_LOCAL === 'true',
    staleTime: 10 * 60 * 1000, // 10 minutes - health zones don't change often
  });
}
