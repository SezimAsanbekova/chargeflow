// Самоуничтожающийся Service Worker.
//
// Раньше на сайте был включён PWA (next-pwa), который зарегистрировал
// Service Worker и кэшировал JS-чанки и /api/* запросы. После отключения PWA
// старый SW оставался в браузерах пользователей и продолжал отдавать
// устаревший код (ошибка "Failed to find Server Action") и пустые сессии
// (петля редиректов на /auth/signin).
//
// Этот файл отдаётся по адресу /sw.js вместо старого SW. Браузер периодически
// перепроверяет /sw.js, обнаруживает новый контент, устанавливает его,
// после чего SW удаляет все кэши и снимает сам себя с регистрации.

self.addEventListener('install', () => {
  // Немедленно активируем новый (этот) SW, не дожидаясь закрытия вкладок
  self.skipWaiting();
});

self.addEventListener('activate', async () => {
  try {
    // 1. Удаляем все кэши, созданные старым Service Worker
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));

    // 2. Снимаем регистрацию самого себя
    await self.registration.unregister();

    // 3. Принудительно перезагружаем все открытые вкладки этого сайта,
    //    чтобы они загрузили свежий код напрямую с сервера (без SW)
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  } catch (e) {
    // Тихо игнорируем — даже при ошибке SW больше не будет мешать
  }
});

// Никакие fetch не перехватываем — все запросы идут напрямую в сеть
