import { apiClient } from './client';
import { ResultsResponse, ResultsQueryParams, ResultHealthZoneDetail, ResultActions } from '@/types/results';

// Results API endpoints
export const resultsApi = {
  // Get all results (requires auth)
  getAll(params?: ResultsQueryParams): Promise<ResultsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.code) {
      searchParams.set('code', params.code);
    }
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/v1/results?${queryString}` : '/v1/results';
    return apiClient.get<ResultsResponse>(endpoint, true);
  },

  // Get PDF download URL for a result
  getPdf(resultId: string) {
    return apiClient.get<Blob>(`/v1/results/${resultId}/pdf`, true, 'blob');
  },

  // Get health zone details for a specific result
  getHealthZoneDetail(resultId: string, healthZoneId: string): Promise<ResultHealthZoneDetail> {
    return apiClient.get<ResultHealthZoneDetail>(
      `/v1/results/${resultId}/health-zones/${healthZoneId}`,
      true
    );
  },

  // Get actions for a result
  getActions(resultId: string): Promise<ResultActions> {
    return apiClient.get<ResultActions>(`/v1/results/${resultId}/actions`, true);
  },
};
