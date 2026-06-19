// Wearable-to-Biomarker mapping and insight generation
import type { WearableMetricType, TrendDirection, BiomarkerRangeStatus, WearableMetricSummary, WearablePeriodData } from '@/types/wearables';
import type { BiomarkerResult } from '@/types/results';

// Biomarker name variations for matching
export const BIOMARKER_NAME_VARIANTS: Record<string, string[]> = {
  'HBA1C': ['Hemoglobin A1c', 'HbA1c', 'Glycated Hemoglobin'],
  'INSULIN': ['Insulin', 'Fasting Insulin'],
  'TRIGLYCERIDES': ['Triglycerides', 'TRIG', 'TG'],
  'HS_CRP': ['Ultrasensitive C-Reactive Protein', 'hs-CRP', 'CRP', 'C-Reactive Protein'],
  'LDL': ['LDL Cholesterol', 'LDL-C', 'Low-Density Lipoprotein'],
  'HDL': ['HDL Cholesterol', 'HDL-C', 'High-Density Lipoprotein'],
  'FERRITIN': ['Ferritin'],
  'CORTISOL': ['Cortisol'],
  'T4': ['Thyroxine', 'T4', 'Free T4'],
  'T3': ['Free Triiodothyronine', 'T3', 'Free T3'],
  'LEPTIN': ['Leptin'],
  'TESTOSTERONE': ['Testosterone', 'Total Testosterone'],
  'FREE_TESTOSTERONE': ['Free testosterone index', 'Free Testosterone'],
  'DHEA_S': ['Dehydroepiandrosterone sulfate', 'DHEA-S', 'DHEA'],
  'ESTRADIOL': ['Estradiol', 'E2'],
  'MAGNESIUM': ['Magnesium', 'Mg'],
};

// Wearable metric to related biomarker codes
export const WEARABLE_BIOMARKER_MAPPING: Record<WearableMetricType, string[]> = {
  calories: ['HBA1C', 'INSULIN', 'TRIGLYCERIDES'],
  steps: ['HS_CRP', 'HBA1C', 'INSULIN', 'LDL', 'HDL', 'TRIGLYCERIDES'],
  heartRate: ['FERRITIN', 'HS_CRP', 'CORTISOL'],
  exercise: ['HS_CRP', 'HBA1C', 'INSULIN', 'LDL', 'HDL', 'TRIGLYCERIDES'],
  sleep: ['HS_CRP', 'HBA1C', 'T4', 'T3', 'CORTISOL', 'INSULIN', 'LEPTIN', 'TESTOSTERONE', 'FREE_TESTOSTERONE', 'DHEA_S', 'ESTRADIOL'],
  hrv: ['HS_CRP', 'CORTISOL', 'MAGNESIUM'],
};

// Reverse mapping: biomarker code to wearable metrics
export function getBiomarkerToWearableMetrics(): Record<string, WearableMetricType[]> {
  const reverseMap: Record<string, WearableMetricType[]> = {};
  
  for (const [metric, biomarkers] of Object.entries(WEARABLE_BIOMARKER_MAPPING)) {
    for (const biomarkerCode of biomarkers) {
      if (!reverseMap[biomarkerCode]) {
        reverseMap[biomarkerCode] = [];
      }
      reverseMap[biomarkerCode].push(metric as WearableMetricType);
    }
  }
  
  return reverseMap;
}

// Match biomarker by name against known variants
export function matchBiomarkerByName(
  biomarkerName: string,
  biomarkerCode: string,
  biomarkers: BiomarkerResult[]
): BiomarkerResult | null {
  // First try exact code match
  let match = biomarkers.find(b => 
    b.code?.toUpperCase() === biomarkerCode.toUpperCase()
  );
  if (match) return match;

  // Try name variants
  const variants = BIOMARKER_NAME_VARIANTS[biomarkerCode] || [biomarkerName];
  for (const variant of variants) {
    match = biomarkers.find(b => 
      b.name?.toLowerCase().includes(variant.toLowerCase()) ||
      variant.toLowerCase().includes(b.name?.toLowerCase() || '')
    );
    if (match) return match;
  }

  return null;
}

// Get biomarker status for wearable display
export function getBiomarkerRangeStatus(biomarker: BiomarkerResult | null): BiomarkerRangeStatus {
  if (!biomarker) return 'not_tested';
  
  const status = biomarker.biomarkerStatus;
  if (status === 'OPTIMAL' || status === 'NORMAL') return 'in_range';
  if (status === 'HIGH' || status === 'LOW') return 'out_of_range';
  return 'not_tested';
}

// Generate insight message based on metric trend and biomarker status
export function generateInsightMessage(
  metricName: string,
  biomarkerName: string,
  metricTrend: TrendDirection,
  biomarkerStatus: BiomarkerRangeStatus,
  locale: 'EN' | 'DE' = 'EN'
): { message: string; isPositive: boolean } {
  const isMetricPositive = metricTrend === 'up' || metricTrend === 'stable';
  
  if (locale === 'DE') {
    if (isMetricPositive && biomarkerStatus === 'out_of_range') {
      return {
        message: `Dein verbessertes ${metricName} könnte helfen, deinen ${biomarkerName} in den Zielbereich zu bringen`,
        isPositive: true,
      };
    }
    if (metricTrend === 'down') {
      return {
        message: `Dein gesunkenes ${metricName} könnte deinen ${biomarkerName} beeinflussen`,
        isPositive: false,
      };
    }
    if (isMetricPositive && biomarkerStatus === 'in_range') {
      return {
        message: `Dein ${metricName} unterstützt weiterhin deinen ${biomarkerName}`,
        isPositive: true,
      };
    }
    return {
      message: `${metricName} kann deinen ${biomarkerName} beeinflussen`,
      isPositive: true,
    };
  }

  // English messages
  if (isMetricPositive && biomarkerStatus === 'out_of_range') {
    return {
      message: `Your improved ${metricName} may help bring your ${biomarkerName} into range`,
      isPositive: true,
    };
  }
  if (metricTrend === 'down') {
    return {
      message: `Your decreased ${metricName} may affect your ${biomarkerName}`,
      isPositive: false,
    };
  }
  if (isMetricPositive && biomarkerStatus === 'in_range') {
    return {
      message: `Your ${metricName} continues to support your ${biomarkerName}`,
      isPositive: true,
    };
  }
  return {
    message: `${metricName} may influence your ${biomarkerName}`,
    isPositive: true,
  };
}

// Get the display name for a biomarker code
export function getBiomarkerDisplayName(code: string): string {
  const variants = BIOMARKER_NAME_VARIANTS[code];
  return variants?.[0] || code;
}

// Metric display configuration
export const WEARABLE_METRIC_CONFIG: Record<WearableMetricType, {
  nameKey: string;
  icon: string;
  unit: string;
  descriptionKey: string;
}> = {
  steps: {
    nameKey: 'wearables.metrics.steps',
    icon: 'footprints',
    unit: 'steps',
    descriptionKey: 'wearables.metricDescriptions.steps',
  },
  calories: {
    nameKey: 'wearables.metrics.calories',
    icon: 'flame',
    unit: 'kcal',
    descriptionKey: 'wearables.metricDescriptions.calories',
  },
  heartRate: {
    nameKey: 'wearables.metrics.heartRate',
    icon: 'heart',
    unit: 'bpm',
    descriptionKey: 'wearables.metricDescriptions.heartRate',
  },
  exercise: {
    nameKey: 'wearables.metrics.exercise',
    icon: 'activity',
    unit: 'min',
    descriptionKey: 'wearables.metricDescriptions.exercise',
  },
  sleep: {
    nameKey: 'wearables.metrics.sleep',
    icon: 'moon',
    unit: 'hrs',
    descriptionKey: 'wearables.metricDescriptions.sleep',
  },
  hrv: {
    nameKey: 'wearables.metrics.hrv',
    icon: 'activity-square',
    unit: 'ms',
    descriptionKey: 'wearables.metricDescriptions.hrv',
  },
};

// Demo data for wearable metrics with period summaries
export const DEMO_WEARABLE_SUMMARY_DATA: WearableMetricSummary[] = [
  {
    id: 'steps',
    name: 'Steps',
    nameKey: 'wearables.metrics.steps',
    icon: 'footprints',
    unit: 'steps',
    currentPeriod: {
      average: 9587,
      min: 6229,
      max: 13602,
      daysTracked: 11,
      totalDays: 14,
      trend: 'down',
      trendPercent: -8,
    },
    previousPeriod: {
      average: 10423,
      min: 7102,
      max: 14230,
      daysTracked: 12,
      totalDays: 14,
      trend: 'stable',
      trendPercent: null,
    },
    relatedBiomarkerCodes: ['HS_CRP', 'HBA1C', 'INSULIN', 'LDL', 'HDL', 'TRIGLYCERIDES'],
    dailyData: [
      { date: '2025-01-14', value: 8234 },
      { date: '2025-01-15', value: 9102 },
      { date: '2025-01-16', value: 6229 },
      { date: '2025-01-17', value: 11403 },
      { date: '2025-01-18', value: 13602 },
      { date: '2025-01-19', value: 10234 },
      { date: '2025-01-20', value: 8903 },
      { date: '2025-01-21', value: 9876 },
      { date: '2025-01-22', value: 7654 },
      { date: '2025-01-23', value: 10234 },
      { date: '2025-01-24', value: 9987 },
    ],
  },
  {
    id: 'calories',
    name: 'Calories Burned',
    nameKey: 'wearables.metrics.calories',
    icon: 'flame',
    unit: 'kcal',
    currentPeriod: {
      average: 487,
      min: 320,
      max: 680,
      daysTracked: 12,
      totalDays: 14,
      trend: 'up',
      trendPercent: 12,
    },
    previousPeriod: {
      average: 435,
      min: 290,
      max: 620,
      daysTracked: 13,
      totalDays: 14,
      trend: 'stable',
      trendPercent: null,
    },
    relatedBiomarkerCodes: ['HBA1C', 'INSULIN', 'TRIGLYCERIDES'],
  },
  {
    id: 'heartRate',
    name: 'Resting Heart Rate',
    nameKey: 'wearables.metrics.heartRate',
    icon: 'heart',
    unit: 'bpm',
    currentPeriod: {
      average: 62,
      min: 58,
      max: 68,
      daysTracked: 14,
      totalDays: 14,
      trend: 'down',
      trendPercent: -5,
    },
    previousPeriod: {
      average: 65,
      min: 60,
      max: 72,
      daysTracked: 14,
      totalDays: 14,
      trend: 'stable',
      trendPercent: null,
    },
    relatedBiomarkerCodes: ['FERRITIN', 'HS_CRP', 'CORTISOL'],
  },
  {
    id: 'exercise',
    name: 'Exercise Time',
    nameKey: 'wearables.metrics.exercise',
    icon: 'activity',
    unit: 'min',
    currentPeriod: {
      average: 45,
      min: 0,
      max: 90,
      daysTracked: 10,
      totalDays: 14,
      trend: 'up',
      trendPercent: 15,
    },
    previousPeriod: {
      average: 39,
      min: 0,
      max: 75,
      daysTracked: 9,
      totalDays: 14,
      trend: 'stable',
      trendPercent: null,
    },
    relatedBiomarkerCodes: ['HS_CRP', 'HBA1C', 'INSULIN', 'LDL', 'HDL', 'TRIGLYCERIDES'],
  },
  {
    id: 'sleep',
    name: 'Sleep Duration',
    nameKey: 'wearables.metrics.sleep',
    icon: 'moon',
    unit: 'hrs',
    currentPeriod: {
      average: 7.2,
      min: 5.5,
      max: 9.0,
      daysTracked: 13,
      totalDays: 14,
      trend: 'stable',
      trendPercent: 2,
    },
    previousPeriod: {
      average: 7.0,
      min: 5.0,
      max: 8.5,
      daysTracked: 14,
      totalDays: 14,
      trend: 'stable',
      trendPercent: null,
    },
    relatedBiomarkerCodes: ['HS_CRP', 'HBA1C', 'T4', 'T3', 'CORTISOL', 'INSULIN', 'LEPTIN', 'TESTOSTERONE', 'DHEA_S', 'ESTRADIOL'],
  },
  {
    id: 'hrv',
    name: 'HRV',
    nameKey: 'wearables.metrics.hrv',
    icon: 'activity-square',
    unit: 'ms',
    currentPeriod: {
      average: 48,
      min: 35,
      max: 65,
      daysTracked: 14,
      totalDays: 14,
      trend: 'up',
      trendPercent: 8,
    },
    previousPeriod: {
      average: 44,
      min: 32,
      max: 58,
      daysTracked: 14,
      totalDays: 14,
      trend: 'stable',
      trendPercent: null,
    },
    relatedBiomarkerCodes: ['HS_CRP', 'CORTISOL', 'MAGNESIUM'],
  },
];

// Check if there's enough data to show trends (threshold: 4 days)
export function hasEnoughData(periodData: WearablePeriodData): boolean {
  return periodData.daysTracked >= 4;
}

// Format coverage text
export function formatCoverage(daysTracked: number, totalDays: number): string {
  return `${daysTracked}/${totalDays}`;
}
