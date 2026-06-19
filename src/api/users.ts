import { apiClient } from './client';
import { UserProfile } from '@/types/user';

// Settings update payload
export interface UserSettingsUpdate {
  language: 'EN' | 'DE';
}

// Users API endpoints
export const usersApi = {
  // Get current user profile (requires auth)
  getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/v1/users/me', true);
  },

  // Update user settings (requires auth)
  updateSettings(settings: UserSettingsUpdate): Promise<UserProfile> {
    return apiClient.patch<UserProfile, UserSettingsUpdate>(
      '/v1/users/me/settings',
      settings,
      true
    );
  },
};
