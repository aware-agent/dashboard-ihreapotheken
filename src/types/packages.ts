// Known biomarker within a package
export interface KnownBiomarker {
  code: string;
  name: string;
  hidden: boolean | null;
  rangeHigh: number | null;
  rangeLow: number | null;
  nameVariations: string[];
  unit1: string;
  unit2: string | null;
  description: string;
  summaryGood: string;
  summaryHigh: string;
  summaryLow: string;
  explanationHigh: string | null;
  explanationLow: string | null;
  source: string | null;
  etiologyHigh: string | null;
  etiologyLow: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
  uuid: string | null;
  outlineGood: string | null;
  outlineHigh: string | null;
  outlineLow: string | null;
  labelLow: string;
  labelInRange: string;
  labelHigh: string;
  cost: number;
  biomarkerIcon: string;
  unit: string;
}

// Package from the packages API
export interface HealthPackage {
  isAddOn: boolean;
  creditAvailable: boolean;
  packageDescription: string;
  packageCode: string;
  packageName: string;
  packageImage: string;
  packagePreviewImage: string;
  packageIcon: string;
  packageOrder: number;
  marketingPrice: string;
  marketingMessage: string;
  knownBiomarkers: KnownBiomarker[];
  featuredKnownBiomarkers: KnownBiomarker[];
  isSubscription: boolean;
}

// Response from GET /api/packages
export interface PackagesResponse {
  packages: HealthPackage[];
}

// Helper to get packages array from response
export function getPackagesFromResponse(response: PackagesResponse): HealthPackage[] {
  return response?.packages || [];
}
