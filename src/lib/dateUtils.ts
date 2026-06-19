import { format, formatDistanceToNow, formatDistance, subMinutes, subHours } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import type { Locale } from '@/locales';

/**
 * Get the date-fns locale object for a given app locale
 */
export function getDateLocale(locale: Locale): typeof de | typeof enUS {
  return locale === 'DE' ? de : enUS;
}

/**
 * Format a date string with locale awareness
 * Common patterns:
 * - 'short': "15. Dez" (DE) or "Dec 15" (EN)
 * - 'medium': "15. Dezember 2024" (DE) or "December 15, 2024" (EN)
 * - 'full': "Montag, 15. Dezember 2024" (DE) or "Monday, December 15, 2024" (EN)
 * - 'monthYear': "Dez '24" (DE) or "Dec '24" (EN)
 * - 'dayMonth': "15 Dez" (DE) or "Dec 15" (EN)
 * - 'time': "14:30" (both)
 */
export function formatLocalizedDate(
  dateString: string | Date,
  pattern: 'short' | 'medium' | 'full' | 'monthYear' | 'dayMonth' | 'time' | string,
  locale: Locale
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const dateLocale = getDateLocale(locale);

  // Predefined patterns that differ by locale
  const patterns: Record<string, { en: string; de: string }> = {
    short: { en: 'MMM d', de: 'd. MMM' },
    medium: { en: 'MMMM d, yyyy', de: 'd. MMMM yyyy' },
    full: { en: 'EEEE, MMMM d, yyyy', de: 'EEEE, d. MMMM yyyy' },
    monthYear: { en: "MMM ''yy", de: "MMM ''yy" },
    dayMonth: { en: 'd MMM', de: 'd. MMM' },
    time: { en: 'HH:mm', de: 'HH:mm' },
  };

  const formatPattern = patterns[pattern]
    ? locale === 'DE' ? patterns[pattern].de : patterns[pattern].en
    : pattern;

  // Remove narrow no-break spaces (\u202F) inserted by some date-fns locales
  return format(date, formatPattern, { locale: dateLocale }).replace(/\u202F/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Format date for cards and lists (e.g., "15. Dez" or "Dec 15")
 */
export function formatShortDate(dateString: string | Date, locale: Locale): string {
  return formatLocalizedDate(dateString, 'short', locale);
}

/**
 * Format date for full display (e.g., "15. Dezember 2024" or "December 15, 2024")
 */
export function formatMediumDate(dateString: string | Date, locale: Locale): string {
  return formatLocalizedDate(dateString, 'medium', locale);
}

/**
 * Format date with weekday (e.g., "Montag, 15. Dezember 2024")
 */
export function formatFullDate(dateString: string | Date, locale: Locale): string {
  return formatLocalizedDate(dateString, 'full', locale);
}

/**
 * Format for chart axis labels (e.g., "Dez '24")
 */
export function formatChartDate(dateString: string | Date, locale: Locale): string {
  return formatLocalizedDate(dateString, 'monthYear', locale);
}

/**
 * Format for day-month display (e.g., "15 Dez" or "Dec 15")  
 */
export function formatDayMonth(dateString: string | Date, locale: Locale): string {
  return formatLocalizedDate(dateString, 'dayMonth', locale);
}

// ============= Number Formatting Utilities =============

/**
 * Format a number with locale-aware decimal separator
 * German uses comma (,) as decimal separator
 * English uses period (.) as decimal separator
 */
export function formatNumber(value: number, locale: Locale, decimals?: number): string {
  const localeCode = locale === 'DE' ? 'de-DE' : 'en-US';
  
  const formatted = decimals !== undefined
    ? value.toLocaleString(localeCode, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value.toLocaleString(localeCode);

  // Strip narrow no-break spaces (\u202F) injected by some environments
  return formatted.replace(/\u202F/g, '').replace(/\s+/g, '');
}

/**
 * Format a number with automatic decimal places (shows up to 2 decimals, but trims trailing zeros)
 */
export function formatNumberAuto(value: number, locale: Locale): string {
  const localeCode = locale === 'DE' ? 'de-DE' : 'en-US';
  return value.toLocaleString(localeCode, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number for display in charts/badges (compact, max 1 decimal)
 */
export function formatNumberCompact(value: number, locale: Locale): string {
  const localeCode = locale === 'DE' ? 'de-DE' : 'en-US';
  return value.toLocaleString(localeCode, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number, locale: Locale, decimals: number = 0): string {
  const localeCode = locale === 'DE' ? 'de-DE' : 'en-US';
  return value.toLocaleString(localeCode, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format with thousands separator (e.g., 1,234 or 1.234)
 */
export function formatInteger(value: number, locale: Locale): string {
  const localeCode = locale === 'DE' ? 'de-DE' : 'en-US';
  return Math.round(value).toLocaleString(localeCode);
}

// ============= Relative Time Formatting Utilities =============

/**
 * Format a date as relative time from now (e.g., "2 hours ago" / "vor 2 Stunden")
 */
export function formatRelativeTime(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: dateLocale 
  });
}

/**
 * Format a relative time from a "minutes ago" number (e.g., 5 → "5 min ago" / "vor 5 Min.")
 */
export function formatMinutesAgo(minutes: number, locale: Locale): string {
  const date = subMinutes(new Date(), minutes);
  return formatRelativeTime(date, locale);
}

/**
 * Format a relative time from an "hours ago" number (e.g., 2 → "2 hours ago" / "vor 2 Stunden")
 */
export function formatHoursAgo(hours: number, locale: Locale): string {
  const date = subHours(new Date(), hours);
  return formatRelativeTime(date, locale);
}

/**
 * Get "just now" text in the appropriate locale
 */
export function getJustNowText(locale: Locale): string {
  return locale === 'DE' ? 'Gerade eben' : 'Just now';
}

/**
 * Parse a relative time string like "5 min ago" or "2 hours ago" and return localized version
 * This is useful for converting hardcoded English relative times to localized ones
 */
export function localizeRelativeTimeString(timeString: string, locale: Locale): string {
  // Handle "Just now" case
  if (timeString.toLowerCase() === 'just now') {
    return getJustNowText(locale);
  }
  
  // Parse patterns like "5 min ago", "2 hours ago", "1 hour ago"
  const minMatch = timeString.match(/^(\d+)\s*min(utes?)?\s*ago$/i);
  if (minMatch) {
    return formatMinutesAgo(parseInt(minMatch[1], 10), locale);
  }
  
  const hourMatch = timeString.match(/^(\d+)\s*hours?\s*ago$/i);
  if (hourMatch) {
    return formatHoursAgo(parseInt(hourMatch[1], 10), locale);
  }
  
  // If we can't parse it, return as-is
  return timeString;
}
