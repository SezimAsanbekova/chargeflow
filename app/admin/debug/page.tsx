'use client';

import { useEffect, useState } from 'react';

export default function AdminDebugPage() {
  const [debug, setDebug] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const results: any = {
      cookies: document.cookie,
      timestamp: new Date().toISOString(),
    };

    // Проверка /api/admin/me
    try {
      const meResponse = await fetch('/api/admin/me');
      results.meStatus = meResponse.status;
      if (meResponse.ok) {
        results.meData = await meResponse.json();
      } else {
        results.meError = await meResponse.text();
      }
    } catch (error) {
      results.meError = String(error);
    }

    // Проверка /api/admin/stations
    try {
      const stationsResponse = await fetch('/api/admin/stations');
      results.stationsStatus = stationsResponse.status;
      if (stationsResponse.ok) {
        const data = await stationsResponse.json();
        results.stationsCount = data.stations?.length || 0;
        results.stationsData = data.stations;
      } else {
        results.stationsError = await stationsResponse.text();
      }
    } catch (error) {
      results.stationsError = String(error);
    }

    // Проверка публичного API
    try {
      const publicResponse = await fetch('/api/stations');
      results.publicStatus = publicResponse.status;
      if (publicResponse.ok) {
        const data = await publicResponse.json();
        results.publicCount = data.length || 0;
      }
    } catch (error) {
      results.publicError = String(error);
    }

    setDebug(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white">Проверка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          🔍 Диагностика админ панели
        </h1>

        {/* Cookies */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Cookies</h2>
          <div className="bg-[#0a1f1a] p-4 rounded-lg">
            <pre className="text-gray-300 text-sm overflow-x-auto">
              {debug.cookies || 'Нет cookies'}
            </pre>
          </div>
          <div className="mt-4">
            {debug.cookies?.includes('admin-token') ? (
              <div className="text-emerald-400">✅ admin-token найден</div>
            ) : (
              <div className="text-red-400">❌ admin-token НЕ найден</div>
            )}
          </div>
        </div>

        {/* /api/admin/me */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            API: /api/admin/me
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Статус:</span>
              <span
                className={`font-semibold ${
                  debug.meStatus === 200
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {debug.meStatus}
              </span>
            </div>
            {debug.meData && (
              <div className="bg-[#0a1f1a] p-4 rounded-lg mt-4">
                <pre className="text-gray-300 text-sm overflow-x-auto">
                  {JSON.stringify(debug.meData, null, 2)}
                </pre>
              </div>
            )}
            {debug.meError && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mt-4">
                <pre className="text-red-400 text-sm overflow-x-auto">
                  {debug.meError}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* /api/admin/stations */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            API: /api/admin/stations
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Статус:</span>
              <span
                className={`font-semibold ${
                  debug.stationsStatus === 200
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {debug.stationsStatus}
              </span>
            </div>
            {debug.stationsCount !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Количество станций:</span>
                <span className="text-emerald-400 font-semibold">
                  {debug.stationsCount}
                </span>
              </div>
            )}
            {debug.stationsData && (
              <div className="bg-[#0a1f1a] p-4 rounded-lg mt-4">
                <pre className="text-gray-300 text-sm overflow-x-auto max-h-96">
                  {JSON.stringify(debug.stationsData, null, 2)}
                </pre>
              </div>
            )}
            {debug.stationsError && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mt-4">
                <pre className="text-red-400 text-sm overflow-x-auto">
                  {debug.stationsError}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* /api/stations (public) */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            API: /api/stations (публичный)
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Статус:</span>
              <span
                className={`font-semibold ${
                  debug.publicStatus === 200
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {debug.publicStatus}
              </span>
            </div>
            {debug.publicCount !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Количество станций:</span>
                <span className="text-emerald-400 font-semibold">
                  {debug.publicCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Решение */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            💡 Решение
          </h2>
          {debug.stationsStatus === 401 || debug.stationsStatus === 403 ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Проблема: Нет авторизации или токен истек
              </p>
              <div className="space-y-2">
                <p className="text-white font-semibold">Что делать:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Выйдите из админ панели</li>
                  <li>Войдите заново через /admin/signin</li>
                  <li>Введите email и получите код в Telegram</li>
                  <li>Вернитесь на эту страницу</li>
                </ol>
              </div>
              <a
                href="/admin/signin"
                className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Войти в админ панель
              </a>
            </div>
          ) : debug.stationsStatus === 200 ? (
            <div className="space-y-4">
              <p className="text-emerald-400 font-semibold">
                ✅ Всё работает! Станции загружаются.
              </p>
              <p className="text-gray-300">
                Найдено станций: {debug.stationsCount}
              </p>
              <a
                href="/admin/stations"
                className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Перейти к станциям
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-400">
                Неизвестная ошибка. Статус: {debug.stationsStatus}
              </p>
              <button
                onClick={checkAuth}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Проверить снова
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
