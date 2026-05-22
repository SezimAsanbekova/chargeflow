'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from '@/app/i18n';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    getTranslations(savedLocale || defaultLocale, 'common').then(setT);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-down ${
        isOnline
          ? 'bg-emerald-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5" />
          <span className="font-medium">{t?.offline?.connectionRestored ?? 'Соединение восстановлено'}</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">{t?.offline?.noConnection ?? 'Нет подключения к интернету'}</span>
        </>
      )}
    </div>
  );
}
