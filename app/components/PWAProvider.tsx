'use client';

import { useEffect } from 'react';
import PWAInstallPrompt from './PWAInstallPrompt';
import IOSInstallPrompt from './IOSInstallPrompt';
import OfflineIndicator from './OfflineIndicator';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Service Worker регистрируется автоматически через next-pwa
    // Обработка обновлений PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Показываем уведомление об обновлении
        if (confirm('Доступна новая версия приложения. Обновить?')) {
          window.location.reload();
        }
      });
    }

    // Предотвращение случайного закрытия при активной зарядке
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasActiveCharging = localStorage.getItem('active-charging');
      if (hasActiveCharging) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <>
      {children}
      <PWAInstallPrompt />
      <IOSInstallPrompt />
      <OfflineIndicator />
    </>
  );
}
