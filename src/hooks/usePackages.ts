import { useQuery } from '@tanstack/react-query';
import { packagesApi } from '@/api/packages';
import { useLocale } from '@/hooks/useLocale';

// Query keys for packages
export const packagesKeys = {
  all: ['packages'] as const,
  byFacility: (facilityId: string, locale: string) => 
    [...packagesKeys.all, 'facility', facilityId, locale] as const,
};

export function usePackages(facilityId: string | null | undefined) {
  const { locale } = useLocale();
  
  return useQuery({
    queryKey: packagesKeys.byFacility(facilityId || '', locale),
    queryFn: () => packagesApi.getPackages(facilityId!),
    enabled: !!facilityId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
