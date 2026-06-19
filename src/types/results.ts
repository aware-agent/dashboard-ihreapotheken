// Biomarker status from API
export type BiomarkerStatus = 'OPTIMAL' | 'NORMAL' | 'HIGH' | 'LOW' | 'NO_RANGE';

// Range ternary: -1 = below range, 0 = in range, 1 = above range, null = no range
export type RangeTernary = -1 | 0 | 1 | null;

// Biomarker result from API
export interface BiomarkerResult {
  id: string;
  name: string;
  code: string;
  value: number;
  valueText: string;
  range: [number | null, number | null];
  rangeTernary: RangeTernary;
  unit: string;
  biomarkerIcon: string | null;
  biomarkerStatus: BiomarkerStatus;
  optimalRange: [number | null, number | null];
  rangeOptimalTernary: RangeTernary;
  rangeType: string | null;
  percentageVariation: number | null;
}

// Health zone summary in result
export interface ResultHealthZone {
  id: string;
  name: string;
  icon: string | null;
  inRange: number;
  outOfRange: number;
}

// Known biomarker (biomarkers user hasn't tested yet)
export interface KnownBiomarker {
  code: string;
  name: string;
  unit: string;
  biomarkerIcon: string | null;
}

// Result type
export type ResultType = 'LAB' | 'SCAN' | 'UPLOAD';

// Single result from API
export interface Result {
  id: string;
  date: string;
  notes: string | null;
  inRange: number;
  outOfRange: number;
  biomarkers: BiomarkerResult[];
  healthZones: ResultHealthZone[];
  knownBiomarkers: KnownBiomarker[];
  seenAt: string | null;
  bookedPackageCodes: string[];
  type: ResultType;
  unsupportedBiomarkers: number;
}

// Package info
export interface Package {
  packageName: string;
  packageDescription: string;
  packageCode: string;
  packageOrder: number;
  isAddOn: boolean;
  marketingPrice: string;
  marketingMessage: string;
}

// Results API response
export interface ResultsResponse {
  hasNewResult: boolean;
  results: Result[];
  packages: Package[];
}

// Query params for results endpoint
export interface ResultsQueryParams {
  code?: string;
}

// Health zone detail for a specific result
export interface ResultHealthZoneDetail {
  id: string;
  name: string;
  icon: string | null;
  biomarkers: BiomarkerResult[];
  inRange: number;
  outOfRange: number;
}

// Triggering indicator for an action
export interface TriggeringIndicator {
  indicator: string;
  isBiomarker: boolean;
}

// Actions for a result
export interface ResultAction {
  code: string;
  category: string;
  triggeringIndicators: TriggeringIndicator[];
  default: boolean;
}

export interface ResultActions {
  actions: ResultAction[];
}
