"use client";

import { useEffect } from 'react';

/**
 * Этот компонент УДАЛЯЕТ старые Service Worker'ы и чистит их кэш.
 *
 * Причина: раньше был включён PWA (next-pwa), который регистрировал sw.js
 * и кэшировал /api/* запросы (включая /api/auth/session).
 * Старый SW остаётся в браузере даже после отключения PWA и отдаёт
 * закэшированную (пустую) сессию -> из-за этого возникала петля редиректов
 * между /auth/signin и /profile на проде.
 *
 * Здесь мы разрегистрируем все SW и удаляем все Cache Storage кэши.
 */
export default function ServiceWorkerLogger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Удаляем все зарегистрированные Service Worker'ы
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length === 0) {
          console.log('✅ [SW] Нет зарегистрированных Service Worker — чисто');
          return;
        }

        console.warn('🧹 [SW] Найдены старые Service Worker, удаляю:', registrations.length);

        registrations.forEach((registration) => {
          registration
            .unregister()
            .then((success) => {
              console.log('🗑️ [SW] Service Worker удалён:', {
                success,
                scope: registration.scope,
              });
            })
            .catch((error) => {
              console.error('❌ [SW] Ошибка удаления Service Worker:', error);
            });
        });
      });
    }

    // 2. Чистим все кэши Cache Storage (там лежат старые ответы /api/auth/session)
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        if (cacheNames.length === 0) return;

        console.warn('🧹 [SW] Удаляю старые кэши:', cacheNames);

        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName).then((success) => {
            console.log('🗑️ [SW] Кэш удалён:', { cacheName, success });
          });
        });
      });
    }
  }, []);

  return null;
}
