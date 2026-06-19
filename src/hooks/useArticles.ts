import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '@/api/articles';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { createQueryKeys } from '@/lib/queryKeys';
import type { ArticlesResponse } from '@/types/articles';

export function useArticles() {
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<ArticlesResponse>({
    queryKey: queryKeys.articles.all,
    queryFn: fetchArticles,
    staleTime: Infinity, // Cache for entire session
    gcTime: Infinity, // Keep in cache indefinitely during session
  });
}
