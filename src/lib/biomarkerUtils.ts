import { MarkerStatus, HealthZone, ReferenceRange } from '@/types/biomarkers';
import type { Locale } from '@/locales';

export function getStatusFromValue(value: number, range: ReferenceRange): MarkerStatus {
  if (range.optimalMin !== undefined && range.optimalMax !== undefined) {
    if (value >= range.optimalMin && value <= range.optimalMax) {
      return 'optimal';
    }
  }
  
  if (value >= range.min && value <= range.max) {
    return 'normal';
  }
  
  const marginLow = (range.max - range.min) * 0.1;
  const marginHigh = (range.max - range.min) * 0.1;
  
  if (value < range.min - marginLow || value > range.max + marginHigh) {
    return 'danger';
  }
  
  if (value < range.min) {
    return 'low';
  }
  
  if (value > range.max) {
    return 'high';
  }
  
  return 'moderate_risk';
}

export function getStatusColor(status: MarkerStatus): string {
  const colors: Record<MarkerStatus, string> = {
    optimal: 'hsl(var(--hm-optimal200))',
    normal: 'hsl(var(--hm-normal200))',
    moderate_risk: 'hsl(var(--hm-moderaterisk200))',
    high: 'hsl(var(--hm-high200))',
    low: 'hsl(var(--hm-highlow200))',
    danger: 'hsl(var(--hm-danger200))',
  };
  return colors[status];
}

export function getStatusBgColor(status: MarkerStatus): string {
  const colors: Record<MarkerStatus, string> = {
    optimal: 'bg-hm-optimal50',
    normal: 'bg-hm-normal50',
    moderate_risk: 'bg-hm-moderaterisk50',
    high: 'bg-hm-high50',
    low: 'bg-hm-highlow50',
    danger: 'bg-hm-danger50',
  };
  return colors[status];
}

export function getStatusTextColor(status: MarkerStatus): string {
  const colors: Record<MarkerStatus, string> = {
    optimal: 'text-hm-optimal200',
    normal: 'text-hm-normal200',
    moderate_risk: 'text-hm-moderaterisk200',
    high: 'text-hm-high200',
    low: 'text-hm-highlow200',
    danger: 'text-hm-danger200',
  };
  return colors[status];
}

export function getZoneColor(zone: HealthZone): string {
  const colors: Record<HealthZone, string> = {
    blood: 'hsl(var(--hz-blood))',
    heart: 'hsl(var(--hz-heart))',
    hormones: 'hsl(var(--hz-hormones))',
    immunity: 'hsl(var(--hz-immunity))',
    kidneys: 'hsl(var(--hz-kidneys))',
    liver: 'hsl(var(--hz-liver))',
    metabolism: 'hsl(var(--hz-metabolism))',
    minerals: 'hsl(var(--hz-minerals))',
    vitamins: 'hsl(var(--hz-vitamins))',
  };
  return colors[zone];
}

export function getZoneBgClass(zone: HealthZone): string {
  const colors: Record<HealthZone, string> = {
    blood: 'bg-[hsl(var(--hz-blood)/0.1)]',
    heart: 'bg-[hsl(var(--hz-heart)/0.1)]',
    hormones: 'bg-[hsl(var(--hz-hormones)/0.1)]',
    immunity: 'bg-[hsl(var(--hz-immunity)/0.1)]',
    kidneys: 'bg-[hsl(var(--hz-kidneys)/0.1)]',
    liver: 'bg-[hsl(var(--hz-liver)/0.1)]',
    metabolism: 'bg-[hsl(var(--hz-metabolism)/0.1)]',
    minerals: 'bg-[hsl(var(--hz-minerals)/0.1)]',
    vitamins: 'bg-[hsl(var(--hz-vitamins)/0.1)]',
  };
  return colors[zone];
}

export function getZoneTextClass(zone: HealthZone): string {
  const colors: Record<HealthZone, string> = {
    blood: 'text-[hsl(var(--hz-blood))]',
    heart: 'text-[hsl(var(--hz-heart))]',
    hormones: 'text-[hsl(var(--hz-hormones))]',
    immunity: 'text-[hsl(var(--hz-immunity))]',
    kidneys: 'text-[hsl(var(--hz-kidneys))]',
    liver: 'text-[hsl(var(--hz-liver))]',
    metabolism: 'text-[hsl(var(--hz-metabolism))]',
    minerals: 'text-[hsl(var(--hz-minerals))]',
    vitamins: 'text-[hsl(var(--hz-vitamins))]',
  };
  return colors[zone];
}

export function formatMarkerValue(value: number, unit: string, locale?: Locale): string {
  if (locale) {
    const localeCode = locale === 'DE' ? 'de-DE' : 'en-US';
    const formatted = value % 1 === 0 
      ? value.toLocaleString(localeCode) 
      : value.toLocaleString(localeCode, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formatted} ${unit}`;
  }
  // Fallback for non-localized usage
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return `${formatted} ${unit}`;
}

export function getStatusLabel(status: MarkerStatus): string {
  const labels: Record<MarkerStatus, string> = {
    optimal: 'Optimal',
    normal: 'Normal',
    moderate_risk: 'Moderate Risk',
    high: 'High',
    low: 'Low',
    danger: 'Critical',
  };
  return labels[status];
}

/**
 * @deprecated Use formatLocalizedDate from '@/lib/dateUtils' instead
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
