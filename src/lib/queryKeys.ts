import type { Locale } from '@/locales';

/**
 * Centralized query key factory that includes locale for language-aware caching.
 * Each language has its own cache entry, so switching languages uses cached data
 * if available, rather than refetching.
 */
export const createQueryKeys = (locale: Locale) => ({
  // User
  user: {
    all: ['user', locale] as const,
    me: () => ['user', 'me', locale] as const,
  },

  // Results
  results: {
    all: ['results', locale] as const,
    list: <T>(params?: T) => ['results', 'list', locale, params] as const,
  },

  // Health Zones
  healthZones: {
    all: ['healthZones', locale] as const,
    list: () => ['healthZones', 'list', locale] as const,
  },

  // Actions
  actions: {
    all: ['actions', locale] as const,
    byResult: (resultId: string) => ['actions', 'result', resultId, locale] as const,
  },

  // Health Profile
  healthProfile: {
    all: ['healthProfile', locale] as const,
    questions: () => ['healthProfile', 'questions', locale] as const,
    userProfile: () => ['healthProfile', 'user', locale] as const,
  },

  // Biomarkers
  biomarkers: {
    all: ['biomarkers', locale] as const,
    detail: (id: string) => ['biomarker', id, locale] as const,
    known: (code: string) => ['biomarker', 'known', code, locale] as const,
  },

  // Articles
  articles: {
    all: ['articles', locale] as const,
  },

  // Result Actions
  resultActions: {
    byResult: (resultId: string) => ['resultActions', resultId, locale] as const,
  },

  // Bio Age
  bioAge: {
    current: ['bioAge', locale] as const,
    history: ['bioAge', 'history', locale] as const,
  },
});

export type QueryKeys = ReturnType<typeof createQueryKeys>;
