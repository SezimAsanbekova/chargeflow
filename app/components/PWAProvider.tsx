'use client';

import { useEffect } from 'react';
import PWAInstallPrompt from './PWAInstallPrompt';
import IOSInstallPrompt from './IOSInstallPrompt';
import OfflineIndicator from './OfflineIndicator';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Регистрация service worker только в production
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker зарегистрирован:', registration);

          // Проверка обновлений каждые 60 секунд
          setInterval(() => {
            registration.update();
          }, 60000);
        })
        .catch((error) => {
          console.error('Ошибка регистрации Service Worker:', error);
        });
    }

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
