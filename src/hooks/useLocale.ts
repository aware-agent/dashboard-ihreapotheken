import { useLocaleContext } from '@/contexts/LocaleContext';

/**
 * Convenience hook for accessing locale context.
 * Provides locale, setLocale, t (translation function), and isChanging.
 */
export function useLocale() {
  return useLocaleContext();
}

// Re-export types for convenience
export type { Locale, TranslationKey } from '@/locales';
