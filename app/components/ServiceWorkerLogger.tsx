"use client";

import { useEffect } from 'react';

export default function ServiceWorkerLogger() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('⚠️ [SW] Service Worker not supported in this browser');
      return;
    }

    console.log('🔍 [SW] Service Worker support detected');

    // Слушаем события регистрации Service Worker
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        console.log('✅ [SW] Service Worker already registered:', {
          scope: registration.scope,
          state: registration.active?.state,
          updateViaCache: registration.updateViaCache,
          timestamp: new Date().toISOString()
        });

        // Слушаем обновления
        registration.addEventListener('updatefound', () => {
          console.log('🔄 [SW] Service Worker update found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('📊 [SW] New Service Worker state:', {
                state: newWorker.state,
                timestamp: new Date().toISOString()
              });
            });
          }
        });
      } else {
        console.log('ℹ️ [SW] No Service Worker registered yet');
      }
    }).catch((error) => {
      console.error('❌ [SW] Error checking Service Worker registration:', {
        error,
        message: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Слушаем ошибки регистрации
    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = function(...args) {
      console.log('🚀 [SW] Attempting to register Service Worker:', {
        url: args[0],
        options: args[1],
        timestamp: new Date().toISOString()
      });

      return originalRegister.apply(this, args).then(
        (registration) => {
          console.log('✅ [SW] Service Worker registered successfully:', {
            scope: registration.scope,
            installing: !!registration.installing,
            waiting: !!registration.waiting,
            active: !!registration.active,
            timestamp: new Date().toISOString()
          });
          return registration;
        },
        (error) => {
          console.error('❌ [SW] Service Worker registration failed:', {
            error,
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
            url: args[0],
            timestamp: new Date().toISOString()
          });
          
          // Дополнительная диагностика для 404 ошибок
          if (error?.message?.includes('404') || error?.message?.includes('bad HTTP')) {
            console.error('🔍 [SW] 404 Error - Service Worker file not found:', {
              expectedUrl: `${window.location.origin}${args[0]}`,
              suggestion: 'Run "npm run build" with NODE_ENV=production to generate sw.js',
              timestamp: new Date().toISOString()
            });
          }
          
          throw error;
        }
      );
    };

    // Слушаем события контроллера
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 [SW] Controller changed - new Service Worker activated');
    });

    // Слушаем сообщения от Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 [SW] Message from Service Worker:', {
        data: event.data,
        origin: event.origin,
        timestamp: new Date().toISOString()
      });
    });

  }, []);

  return null;
}
