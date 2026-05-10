'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Download, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { usePWA, useOnlineStatus } from '../hooks/usePWA';

export default function PWAStatus() {
  const { isInstalled, isStandalone, isIOS, isAndroid } = usePWA();
  const isOnline = useOnlineStatus();
  const [cacheSize, setCacheSize] = useState<string>('');

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
          Статус приложения
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
              Установлено
            </span>
          </div>
          <span className={`font-medium ${isInstalled ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isInstalled ? 'Да' : 'Нет'}
          </span>
        </div>

        {/* Режим отображения */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300">
            Режим
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {isStandalone ? 'Приложение' : 'Браузер'}
          </span>
        </div>

        {/* Платформа */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span className="text-gray-700 dark:text-gray-300">
            Платформа
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
              Подключение
            </span>
          </div>
          <span className={`font-medium ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? 'Онлайн' : 'Офлайн'}
          </span>
        </div>

        {/* Размер кэша */}
        {cacheSize && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">
              Кэш
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
            {isIOS && 'Safari → Поделиться → На экран «Домой»'}
            {isAndroid && 'Меню браузера → Установить приложение'}
            {!isIOS && !isAndroid && 'Иконка установки в адресной строке'}
          </p>
        </div>
      )}
    </div>
  );
}
