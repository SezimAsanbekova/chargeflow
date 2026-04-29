import type { Locale } from './config';

export const LOCALE_COOKIE_NAME = 'locale';

export function getLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split('; ');
  const localeCookie = cookies.find(row => row.startsWith(`${LOCALE_COOKIE_NAME}=`));
  
  if (localeCookie) {
    return localeCookie.split('=')[1] as Locale;
  }
  
  return null;
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') return;
  
  // Устанавливаем cookie на 1 год
  const maxAge = 365 * 24 * 60 * 60; // секунды
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
