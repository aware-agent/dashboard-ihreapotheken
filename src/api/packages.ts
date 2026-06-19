import { bffApiClient } from './bffClient';
import type { PackagesResponse } from '@/types/packages';

export const packagesApi = {
  // Get packages for a facility
  async getPackages(facilityId: string): Promise<PackagesResponse> {
    const response = await bffApiClient.get<PackagesResponse>(
      `/packages?bookingFlowType=conventional&facilityId=${facilityId}`,
      true // requires auth
    );
    return response;
  },
};
