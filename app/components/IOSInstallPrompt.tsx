'use client';

import { useEffect, useState } from 'react';
import { X, Share, Plus, Home } from 'lucide-react';

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Проверяем, что это iOS и приложение не установлено
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('ios-install-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      // Показываем промпт через 3 секунды после загрузки
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Закрыть"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Установить ChargeFlow
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Добавьте приложение на главный экран для быстрого доступа
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white font-medium mb-1">
                Нажмите кнопку "Поделиться"
              </p>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Share className="w-5 h-5" />
                <span className="text-sm">В нижней части экрана</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white font-medium mb-1">
                Выберите "На экран «Домой»"
              </p>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Plus className="w-5 h-5" />
                <span className="text-sm">Прокрутите вниз в меню</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white font-medium mb-1">
                Нажмите "Добавить"
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Готово! Приложение появится на главном экране
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
