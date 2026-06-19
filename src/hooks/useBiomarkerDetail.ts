import { useQuery } from '@tanstack/react-query';
import { getBiomarkerDetail, getKnownBiomarkerByCode } from '@/api/biomarkers';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { createQueryKeys } from '@/lib/queryKeys';
import type { BiomarkerDetailResponse } from '@/types/biomarkerDetail';

// Hook for fetching biomarker detail by foundBiomarkerId (tested biomarker)
export function useBiomarkerDetail(foundBiomarkerId: string | undefined) {
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<BiomarkerDetailResponse>({
    queryKey: queryKeys.biomarkers.detail(foundBiomarkerId || ''),
    queryFn: () => getBiomarkerDetail(foundBiomarkerId!),
    enabled: !!foundBiomarkerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching known biomarker detail by code (untested biomarker)
export function useKnownBiomarkerDetail(code: string | undefined) {
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<BiomarkerDetailResponse>({
    queryKey: queryKeys.biomarkers.known(code || ''),
    queryFn: () => getKnownBiomarkerByCode(code!),
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
