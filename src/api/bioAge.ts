import type { BioAgeData, BioAgeHistory } from '@/types/bioAge';
import { bffApiClient } from './bffClient';

export const bioAgeApi = {
    async getCurrentBioAge(): Promise<BioAgeData> {
        const response = await bffApiClient.get<BioAgeData>('/bio-age', true);
        return response;
    },

    async getBioAgeHistory(): Promise<BioAgeHistory> {
        const response = await bffApiClient.get<BioAgeHistory>('/bio-age-progress', true);
        return response;
    },
};
