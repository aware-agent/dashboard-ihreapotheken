// Wearable types for biomarker-led summary feature

export type WearableSummaryPeriod = 'biweekly' | 'monthly';

export type WearableMetricType = 
  | 'calories'
  | 'steps'
  | 'heartRate'
  | 'exercise'
  | 'sleep'
  | 'hrv';

export type TrendDirection = 'up' | 'down' | 'stable';

export type BiomarkerRangeStatus = 'in_range' | 'out_of_range' | 'not_tested';

export interface WearablePeriodData {
  average: number;
  min: number;
  max: number;
  daysTracked: number;
  totalDays: number;
  trend: TrendDirection;
  trendPercent: number | null;
}

export interface WearableMetricSummary {
  id: WearableMetricType;
  name: string;
  nameKey: string;
  icon: string;
  unit: string;
  currentPeriod: WearablePeriodData;
  previousPeriod?: WearablePeriodData;
  relatedBiomarkerCodes: string[];
  // Daily data points for chart (optional)
  dailyData?: { date: string; value: number }[];
}

export interface RelatedBiomarkerInfo {
  code: string;
  name: string;
  status: BiomarkerRangeStatus;
  id?: string; // UUID for navigation if tested
}

export interface WearableInsight {
  metricId: WearableMetricType;
  metricName: string;
  biomarkerName: string;
  biomarkerCode: string;
  trend: TrendDirection;
  message: string;
  isPositive: boolean;
}
