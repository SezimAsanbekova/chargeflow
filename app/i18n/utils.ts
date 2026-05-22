import { Locale, defaultLocale } from "./config";
import type { TranslationPage } from "./types";

export async function getTranslations(
  locale: Locale,
  page: TranslationPage,
): Promise<Record<string, any>> {
  try {
    const translations = await import(`./locales/${locale}/${page}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${page}:`, error);
    if (locale !== defaultLocale) {
      return getTranslations(defaultLocale, page);
    }
    return {};
  }
}

/**
 * Маппинг нашей локали → Intl BCP-47 код для форматирования дат.
 * kg → ky-KG (кыргызский): "15 май 2026-ж."
 * ru → ru-RU (русский):    "15 мая 2026 г."
 */
export function getIntlLocale(locale: Locale): string {
  return locale === "kg" ? "ky-KG" : "ru-RU";
}

export function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }

  return typeof current === "string" ? current : path;
}
