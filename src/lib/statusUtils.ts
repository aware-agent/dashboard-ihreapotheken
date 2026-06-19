import { BiomarkerStatus } from '@/types/results';
import { MarkerStatus } from '@/types/biomarkers';

// Unified status configuration - single source of truth
export const statusConfig: Record<BiomarkerStatus, {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  fillColor: string;
}> = {
  OPTIMAL: {
    label: 'optimal',
    textClass: 'text-hm-optimal200',
    bgClass: 'bg-hm-optimal50',
    borderClass: 'border-hm-optimal100',
    fillColor: 'hsl(var(--hm-optimal200))',
  },
  NORMAL: {
    label: 'normal',
    textClass: 'text-hm-normal200',
    bgClass: 'bg-hm-normal50',
    borderClass: 'border-hm-normal100',
    fillColor: 'hsl(var(--hm-normal200))',
  },
  HIGH: {
    label: 'high',
    textClass: 'text-hm-highlow200',
    bgClass: 'bg-hm-highlow50',
    borderClass: 'border-hm-highlow100',
    fillColor: 'hsl(var(--hm-highlow200))',
  },
  LOW: {
    label: 'low',
    textClass: 'text-hm-highlow200',
    bgClass: 'bg-hm-highlow50',
    borderClass: 'border-hm-highlow100',
    fillColor: 'hsl(var(--hm-highlow200))',
  },
  NO_RANGE: {
    label: 'noRange',
    textClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-border',
    fillColor: 'hsl(var(--muted-foreground))',
  },
};

// Convert API status to local MarkerStatus
export function convertApiStatus(apiStatus: BiomarkerStatus): MarkerStatus {
  const statusMap: Record<BiomarkerStatus, MarkerStatus> = {
    'OPTIMAL': 'optimal',
    'NORMAL': 'normal',
    'HIGH': 'high',
    'LOW': 'low',
    'NO_RANGE': 'normal',
  };
  return statusMap[apiStatus] || 'normal';
}

// Check if status is "in range" (optimal or normal)
export function isInRange(status: BiomarkerStatus): boolean {
  return status === 'OPTIMAL' || status === 'NORMAL';
}

// Check if status is "out of range" (high or low)
export function isOutOfRange(status: BiomarkerStatus): boolean {
  return status === 'HIGH' || status === 'LOW';
}

// Get status config safely
export function getStatusConfig(status: BiomarkerStatus) {
  return statusConfig[status] || statusConfig.NO_RANGE;
}

// Format range text from tuple
export function formatRangeText(range: [number | null, number | null], unit?: string): string {
  const [min, max] = range;
  let text = '';

  if (min !== null && max !== null) {
    text = `${min} - ${max}`;
  } else if (min !== null) {
    text = `≥ ${min}`;
  } else if (max !== null) {
    text = `≤ ${max}`;
  } else {
    text = 'N/A';
  }

  return unit ? `${text} ${unit}` : text;
}

// Get trend direction from percentage change
export type TrendDirection = 'up' | 'down' | 'stable';

export function getTrendDirection(percentageChange: number | null): TrendDirection {
  if (percentageChange === null) return 'stable';
  if (percentageChange > 2) return 'up';
  if (percentageChange < -2) return 'down';
  return 'stable';
}

// Determine if a trend is positive (improvement) based on status and direction
export function isTrendPositive(
  currentStatus: BiomarkerStatus,
  direction: TrendDirection
): boolean {
  // For HIGH status, going down is good
  if (currentStatus === 'HIGH' && direction === 'down') return true;
  // For LOW status, going up is good
  if (currentStatus === 'LOW' && direction === 'up') return true;
  // For OPTIMAL/NORMAL, staying stable is good
  if ((currentStatus === 'OPTIMAL' || currentStatus === 'NORMAL') && direction === 'stable') return true;
  return false;
}
