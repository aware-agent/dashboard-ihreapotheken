import type { BioAgeData, BioAgeHistory, BioAge } from '@/types/bioAge';
import { useQuery } from '@tanstack/react-query';
import { createQueryKeys } from '@/lib/queryKeys';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { bioAgeApi } from '@/api/bioAge';

export function useBioAge() {
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<BioAgeData, Error, BioAgeData['bioAge'] | null>({
    queryKey: queryKeys.bioAge.current,
    queryFn: () => bioAgeApi.getCurrentBioAge(),
    select: (data) => data?.bioAge ?? null,
  });
}

export function useBioAgeHistory() {
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<BioAgeHistory, Error, BioAge[] | null>({
    queryKey: queryKeys.bioAge.history,
    queryFn: () => bioAgeApi.getBioAgeHistory(),
    select: (data) => data?.bioAgeProgress ?? null,
  });
}
