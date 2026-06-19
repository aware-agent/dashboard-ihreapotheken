import { de } from './de';
import { en, type Translations } from './en';

// Supported locales
export type Locale = 'EN' | 'DE';

// All translations
export const translations: Record<Locale, Translations> = {
  EN: en,
  DE: de,
};

// TranslationKey is just a string to allow dot-notation access
export type TranslationKey = string;

// Get nested value from object by dot-notation path
export function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return the key itself if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

export { en, de, type Translations };
