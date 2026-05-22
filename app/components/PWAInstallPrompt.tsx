'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from '@/app/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    getTranslations(savedLocale || defaultLocale, 'common').then(setT);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Показываем промпт только если пользователь еще не отклонил его
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA установлено');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label={t?.close ?? 'Закрыть'}
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {t?.pwa?.installTitle ?? 'Установить ChargeFlow'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {t?.pwa?.installDescriptionShort ?? 'Установите приложение для быстрого доступа и работы офлайн'}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t?.pwa?.installButton ?? 'Установить'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t?.pwa?.laterButton ?? 'Позже'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
