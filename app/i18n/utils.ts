import { Locale, defaultLocale } from './config';
import type { LandingTranslations, TranslationPage } from './types';

type TranslationKeys = {
  [key: string]: string | TranslationKeys;
};

type TranslationMap = {
  landing: LandingTranslations;
};

export async function getTranslations<T extends TranslationPage>(
  locale: Locale,
  page: T
): Promise<TranslationMap[T]> {
  try {
    const translations = await import(`./locales/${locale}/${page}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${page}:`, error);
    // Fallback to default locale
    if (locale !== defaultLocale) {
      return getTranslations(defaultLocale, page);
    }
    return {} as TranslationMap[T];
  }
}

export function getNestedValue(obj: TranslationKeys, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the path if translation not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}
