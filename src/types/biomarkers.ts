export type MarkerStatus = 'optimal' | 'normal' | 'moderate_risk' | 'high' | 'low' | 'danger';

export type HealthZone = 'blood' | 'heart' | 'hormones' | 'immunity' | 'kidneys' | 'liver' | 'metabolism' | 'minerals' | 'vitamins';

export interface ReferenceRange {
  min: number;
  max: number;
  optimalMin?: number;
  optimalMax?: number;
}

export interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceRange: ReferenceRange;
  status: MarkerStatus;
  zone: HealthZone;
  description: string;
  lastUpdated: string;
}

export interface HealthPanel {
  id: string;
  name: string;
  zone: HealthZone;
  markers: Biomarker[];
  overallStatus: MarkerStatus;
  icon: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface MarkerTrend {
  markerId: string;
  markerName: string;
  unit: string;
  referenceRange: ReferenceRange;
  data: TrendDataPoint[];
}

export interface DashboardSummary {
  totalMarkers: number;
  inRangeCount: number;
  needsAttentionCount: number;
  lastTestDate: string;
}
