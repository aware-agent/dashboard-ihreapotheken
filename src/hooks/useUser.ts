import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import type { ApiError } from '@/types/api';
import type { UserProfile } from '@/types/user';
import { useCookies } from './useCookies';

// Query key for user profile (not locale-dependent since user data isn't localized)
export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

// Hook for fetching current user profile
// Note: User profile data is not language-dependent, so no locale in query key
export function useUserProfile() {
  const { isAuthenticated } = useCookies();

  const query = useQuery<UserProfile, ApiError>({
    queryKey: userKeys.me(),
    queryFn: usersApi.getMe,
    enabled: isAuthenticated() || import.meta.env.VITE_LOCAL === 'true',
  });

  return query;
}
