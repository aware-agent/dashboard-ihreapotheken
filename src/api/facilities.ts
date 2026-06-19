import { apiClient } from './client';
import type { FacilitiesResponse } from '@/types/facilities';

export const facilitiesApi = {
  // Get all facilities
  async getAllFacilities(): Promise<FacilitiesResponse> {
    const response = await apiClient.get<FacilitiesResponse>('/v1/facilities', true);
    return response;
  },
};
