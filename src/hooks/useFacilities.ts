import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facilitiesApi } from '@/api/facilities';
import { useLocale } from '@/hooks/useLocale';
import type { Facility } from '@/types/facilities';

// Query keys for facilities
export const facilitiesKeys = {
  all: ['facilities'] as const,
  list: (locale: string) => [...facilitiesKeys.all, 'list', locale] as const,
};

export function useFacilities(facilityId?: string | null) {
  const { locale } = useLocale();

  const query = useQuery({
    queryKey: facilitiesKeys.list(locale),
    queryFn: () => facilitiesApi.getAllFacilities(),
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Filter facilities by facilityCode client-side
  const filteredFacility = useMemo(() => {
    if (!facilityId || !query.data?.facilities) {
      return null;
    }
    return query.data.facilities.find(
      (facility: Facility) => facility.id === facilityId
    ) || null;
  }, [facilityId, query.data?.facilities]);

  return {
    ...query,
    facility: filteredFacility,
  };
}
