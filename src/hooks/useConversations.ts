import { useQuery } from '@tanstack/react-query';
import { listConversations } from '@/api/companion';
import { getUserIdFromToken } from '@/utils/jwt';
import { useCookies } from './useCookies';

export function useConversations(options?: { limit?: number; cursor?: string }) {
  const { authCookies } = useCookies();
  const userId = getUserIdFromToken(authCookies.accessToken);

  return useQuery({
    queryKey: ['conversations', userId, options?.limit, options?.cursor],
    queryFn: () => {
      if (!userId) throw new Error('User ID not available');
      return listConversations(userId, options);
    },
    enabled: !!userId && !!authCookies.accessToken,
    staleTime: 30 * 1000, // 30 seconds
  });
}
