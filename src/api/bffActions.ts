import { bffApiClient } from './bffClient';
import type { BffActionsResponse } from '@/types/actions';

export const bffActionsApi = {
  // Get personalized actions for a specific result
  async getActions(resultId: string): Promise<BffActionsResponse> {
    const response = await bffApiClient.get<BffActionsResponse>(
      `/actions/${resultId}/actions`,
      true // requires auth
    );
    return response;
  },
};
