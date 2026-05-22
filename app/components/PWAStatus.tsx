'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Download, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { usePWA, useOnlineStatus } from '../hooks/usePWA';
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from '@/app/i18n';

export default function PWAStatus() {
  const { isInstalled, isStandalone, isIOS, isAndroid } = usePWA();
  const isOnline = useOnlineStatus();
  const [cacheSize, setCacheSize] = useState<string>('');
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    getTranslations(savedLocale || defaultLocale, 'common').then(setT);
  }, []);

  useEffect(() => {
    // Получаем размер кэша (если доступно)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        if (usage && quota) {
          const usedMB = (usage / (1024 * 1024)).toFixed(2);
          setCacheSize(`${usedMB} МБ`);
        }
      });
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t?.pwa?.statusTitle ?? 'Статус приложения'}
        </h2>
      </div>

      <div className="space-y-3">
        {/* Статус установки */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isInstalled ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <Download className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-gray-700 dark:text-gray-300">
              {t?.pwa?.installed ?? 'Установлено'}
            </span>
          </div>
          <span className={`font-medium ${isInstalled ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isInstalled ? (t?.yes ?? 'Да') : (t?.no ?? 'Нет')}
          </span>
        </div>

        {/* Режим отображения */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300">
            {t?.pwa?.mode ?? 'Режим'}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {isStandalone ? (t?.pwa?.modeApp ?? 'Приложение') : (t?.pwa?.modeBrowser ?? 'Браузер')}
          </span>
        </div>

        {/* Платформа */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300">
            {t?.pwa?.platform ?? 'Платформа'}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}
          </span>
        </div>

        {/* Статус подключения */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-gray-700 dark:text-gray-300">
              {t?.pwa?.connection ?? 'Подключение'}
            </span>
          </div>
          <span className={`font-medium ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? (t?.pwa?.online ?? 'Онлайн') : (t?.pwa?.offline ?? 'Офлайн')}
          </span>
        </div>

        {/* Размер кэша */}
        {cacheSize && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">
              {t?.pwa?.cache ?? 'Кэш'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {cacheSize}
            </span>
          </div>
        )}
      </div>

      {/* Кнопка установки */}
      {!isInstalled && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-2">
            💡 Установите приложение для быстрого доступа и работы офлайн
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-300">
            {isIOS && (t?.pwa?.iosInstallHint ?? 'Safari → Поделиться → На экран «Домой»')}
            {isAndroid && (t?.pwa?.androidInstallHint ?? 'Меню браузера → Установить приложение')}
            {!isIOS && !isAndroid && (t?.pwa?.desktopInstallHint ?? 'Иконка установки в адресной строке')}
          </p>
        </div>
      )}
    </div>
  );
}
