import { apiClient } from './client';
import { bffApiClient } from './bffClient';
import type {
  HealthProfileQuestionsApiResponse,
  HealthProfileQuestionsResponse,
  UserHealthProfileApiResponse,
  UserHealthProfileResponse,
  UserHealthProfile,
} from '@/types/healthProfile';

export const healthProfileApi = {
  // Get questions from BFF (different base URL)
  async getQuestions(): Promise<HealthProfileQuestionsResponse> {
    const response = await bffApiClient.get<HealthProfileQuestionsApiResponse>('/actions/health-profile', true);
    return response?.healthProfile || [];
  },

  // Get user's current health profile answers
  async getUserProfile(): Promise<UserHealthProfileResponse> {
    const response = await apiClient.get<UserHealthProfileApiResponse>('/v1/users/me/health-profile', true);
    return { healthProfile: response?.healthProfile || [] };
  },

  // Create health profile for new users
  createProfile(data: UserHealthProfile): Promise<UserHealthProfileResponse> {
    return apiClient.post<UserHealthProfileResponse, UserHealthProfile>(
      '/v1/users/me/health-profile',
      data,
      true
    );
  },

  // Partially update existing health profile
  updateProfile(data: UserHealthProfile): Promise<UserHealthProfileResponse> {
    return apiClient.patch<UserHealthProfileResponse, UserHealthProfile>(
      '/v1/users/me/health-profile',
      data,
      true
    );
  },
};
