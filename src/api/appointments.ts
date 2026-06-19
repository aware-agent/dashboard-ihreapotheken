import { bffApiClient } from './bffClient';
import type { AppointmentsResponse } from '@/types/appointments';

// Appointments API endpoints
export const appointmentsApi = {
    // Get all appointments (requires auth)
    getAll(): Promise<AppointmentsResponse> {
        return bffApiClient.get<AppointmentsResponse>('/appointments', true);
    },
};
