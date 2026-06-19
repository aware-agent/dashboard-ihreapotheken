import { Facility } from "./facilities";
import { Package } from "./results";
import { UserProfile } from "./user";

export interface Appointment {
    id: string;
    beganAt?: string;
    endedAt?: string;
    checkedInAt?: string;
    consentAt?: string;
    status: string;
    bookedPackageCodes?: string[];
    facility: Facility;
    user: UserProfile;

}


export interface AppointmentsResponse {
    appointments: Appointment[];
    packages: Package[];
    sortBy: string;
    sortDirection: string;
    total: number;

}