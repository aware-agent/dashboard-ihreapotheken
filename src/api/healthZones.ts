import { apiClient } from './client';
import { HealthZonesResponse } from '@/types/healthZones';

// Health Zones API endpoints
export const healthZonesApi = {
  // Get all health zones (requires auth)
  getAll(): Promise<HealthZonesResponse> {
    return apiClient.get<HealthZonesResponse>('/v1/health-zones', true);
  },
};
