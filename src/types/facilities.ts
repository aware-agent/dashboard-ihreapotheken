// Facility from the facilities API
export interface Facility {
  id: string;
  facilityCode: string;
  name: string;
  // Add other facility properties as needed
}

// Response from GET /facilities
export interface FacilitiesResponse {
  facilities: Facility[];
}
