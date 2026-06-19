import { apiClient } from './client';
import { BiomarkerDetailResponse } from '@/types/biomarkerDetail';

// Get biomarker detail by foundBiomarkerId (tested biomarker with result)
export async function getBiomarkerDetail(foundBiomarkerId: string): Promise<BiomarkerDetailResponse> {
  return apiClient.get<BiomarkerDetailResponse>(`/v1/biomarkers/${foundBiomarkerId}`, true);
}

// Get known biomarker detail by code (untested biomarker)
export async function getKnownBiomarkerByCode(code: string): Promise<BiomarkerDetailResponse> {
  return apiClient.get<BiomarkerDetailResponse>(`/v1/biomarkers/known/${code}`, true);
}
