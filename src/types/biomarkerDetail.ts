// Types for the biomarker detail API response

export interface HealthFact {
  title: string;
  description: string;
  image: string | null;
  url: string | null;
}

export interface Article {
  id: string;
  title: string;
  image: string | null;
  url: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Outline {
  title: string;
  description: string;
  image: string | null;
  url: string | null;
}

export interface Disclaimer {
  title: string;
  description: string;
  summary: string;
}

export interface HealthFoodItem {
  id: string;
  name: string;
  image: string | null;
}

export interface FoodItem {
  title: string;
  healthFoodItems: HealthFoodItem[];
}

export interface HealthHabitItem {
  id: string;
  title: string;
  description: string;
  image: string | null;
}

export interface HealthHabit {
  title: string;
  healthHabitItems: HealthHabitItem[];
}

export type BiomarkerDetailStatus = 'OPTIMAL' | 'NORMAL' | 'HIGH' | 'LOW' | 'NO_RANGE' | 'NOT_TESTED';

export interface BiomarkerDetailResponse {
  id?: string; // Optional - not present for known biomarkers
  name: string;
  code: string;
  value?: number; // Optional - not present for known biomarkers
  valueText?: string; // Optional - not present for known biomarkers
  unit: string;
  range: [number | null, number | null];
  rangeTernary?: -1 | 0 | 1 | null;
  optimalRange?: [number | null, number | null];
  optimalRangesInfo: unknown | null;
  rangeOptimalTernary?: -1 | 0 | 1 | null;
  biomarkerStatus: BiomarkerDetailStatus;
  description: string | null;
  summary?: string | null;
  explanation?: string | null;
  etiology?: string | null;
  outline?: Outline | null;
  healthFacts: HealthFact[];
  articles: Article[];
  healthZoneIds: string[];
  labelHigh?: string;
  labelInRange?: string;
  labelLow?: string;
  foodItem: FoodItem | null;
  healthHabit: HealthHabit | null;
  biomarkerIcon: string | null;
  disclaimer?: Disclaimer | null;
  rangeType?: string | null;
}
