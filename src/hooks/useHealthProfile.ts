import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthProfileApi } from '@/api/healthProfile';
import { useLocaleContext } from '@/contexts/LocaleContext';
import { createQueryKeys } from '@/lib/queryKeys';
import type {
  HealthProfileQuestionsResponse,
  UserHealthProfileResponse,
  UserHealthProfile,
  HealthProfileAnswer,
  HealthProfileCategory,
} from '@/types/healthProfile';
import type { ApiError } from '@/types/api';
import { useCookies } from './useCookies';

// Query keys for cache management (legacy export for compatibility)
export const healthProfileKeys = {
  all: ['healthProfile'] as const,
  questions: () => [...healthProfileKeys.all, 'questions'] as const,
  userProfile: () => [...healthProfileKeys.all, 'user'] as const,
};

// Hook to fetch all questions from BFF
export function useHealthProfileQuestions() {
  const { isAuthenticated } = useCookies();
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<HealthProfileQuestionsResponse, ApiError>({
    queryKey: queryKeys.healthProfile.questions(),
    queryFn: () => healthProfileApi.getQuestions(),
    enabled: isAuthenticated() || import.meta.env.VITE_LOCAL === 'true',
    staleTime: 1000 * 60 * 60, // 1 hour - questions rarely change
  });
}

// Hook to fetch user's health profile answers
export function useUserHealthProfile() {
  const { isAuthenticated } = useCookies();
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useQuery<UserHealthProfileResponse, ApiError>({
    queryKey: queryKeys.healthProfile.userProfile(),
    queryFn: () => healthProfileApi.getUserProfile(),
    enabled: isAuthenticated() || import.meta.env.VITE_LOCAL === 'true',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutation to save/update health profile answers
export function useSaveHealthProfile() {
  const queryClient = useQueryClient();
  const { locale } = useLocaleContext();
  const queryKeys = createQueryKeys(locale);

  return useMutation<
    UserHealthProfileResponse,
    ApiError,
    { data: UserHealthProfile; isNew: boolean }
  >({
    mutationFn: ({ data, isNew }) =>
      isNew
        ? healthProfileApi.createProfile(data)
        : healthProfileApi.updateProfile(data),
    onSuccess: () => {
      // Invalidate user profile to refetch latest data
      queryClient.invalidateQueries({ queryKey: queryKeys.healthProfile.userProfile() });
    },
  });
}

// Utility: Calculate progress for a single category
export function calculateCategoryProgress(
  category: HealthProfileCategory | null | undefined,
  answers: HealthProfileAnswer[] | null | undefined
): { answered: number; total: number } {
  // Handle null/undefined inputs
  if (!category || !category.questions) {
    return { answered: 0, total: 0 };
  }

  const safeAnswers = Array.isArray(answers) ? answers : [];
  const questionCodes = category.questions.map((q) => q.code);
  const answeredCount = safeAnswers.filter(
    (a) => questionCodes.includes(a.code) && a.value !== null
  ).length;

  return {
    answered: answeredCount,
    total: category.questions.length,
  };
}

// Utility: Calculate overall progress percentage
export function calculateOverallProgress(
  categories: HealthProfileCategory[] | null | undefined,
  answers: HealthProfileAnswer[] | null | undefined
): number {
  // Handle null/undefined inputs - ensure we have arrays
  if (!Array.isArray(categories) || categories.length === 0) {
    return 0;
  }

  const safeAnswers = Array.isArray(answers) ? answers : [];

  const totalQuestions = categories.reduce(
    (sum, cat) => sum + (cat.questions?.length || 0),
    0
  );

  if (totalQuestions === 0) return 0;

  const allQuestionCodes = categories.flatMap((cat) =>
    (cat.questions || []).map((q) => q.code)
  );

  const answeredCount = safeAnswers.filter(
    (a) => allQuestionCodes.includes(a.code) && a.value !== null
  ).length;

  return Math.round((answeredCount / totalQuestions) * 100);
}

// Utility: Check if health profile is complete
export function isProfileComplete(
  categories: HealthProfileCategory[] | null | undefined,
  answers: HealthProfileAnswer[] | null | undefined
): boolean {
  return calculateOverallProgress(categories, answers) === 100;
}
