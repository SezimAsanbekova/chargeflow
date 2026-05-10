# 🧪 PWA Testing Guide

## Быстрое тестирование

### 1. Сборка и запуск
```bash
npm run build
npm start
```

### 2. Открыть в браузере
```
http://localhost:3000
```

### 3. Проверить основные функции
- [ ] Промпт установки появляется
- [ ] Приложение устанавливается
- [ ] Офлайн режим работает
- [ ] Иконки отображаются
- [ ] Manifest загружается

## Детальное тестирование

### Chrome DevTools

#### 1. Lighthouse Audit
```
1. Открыть DevTools (F12)
2. Вкладка "Lighthouse"
3. Выбрать "Progressive Web App"
4. Нажать "Generate report"
```

**Ожидаемый результат:** Оценка 90+ баллов

**Проверяемые критерии:**
- ✅ Installable
- ✅ PWA Optimized
- ✅ Fast and reliable
- ✅ Works offline

#### 2. Application Panel

**Manifest:**
```
1. DevTools → Application → Manifest
2. Проверить все поля
3. Проверить иконки
```

**Service Workers:**
```
1. DevTools → Application → Service Workers
2. Проверить статус: "activated and is running"
3. Проверить scope: "/"
```

**Cache Storage:**
```
1. DevTools → Application → Cache Storage
2. Должны быть кэши:
   - workbox-precache-v2-...
   - google-fonts-webfonts
   - static-image-assets
   - next-data
   - apis
```

**Storage:**
```
1. DevTools → Application → Storage
2. Проверить Usage
3. Проверить Quota
```

#### 3. Network Panel

**Офлайн режим:**
```
1. DevTools → Network
2. Выбрать "Offline"
3. Обновить страницу
4. Приложение должно работать
```

**Throttling:**
```
1. DevTools → Network
2. Выбрать "Slow 3G"
3. Обновить страницу
4. Проверить скорость загрузки
```

### Тестирование установки

#### Android (Chrome)
```
1. Открыть в Chrome
2. Должен появиться баннер "Установить ChargeFlow"
3. Нажать "Установить"
4. Приложение открывается в отдельном окне
5. Иконка появляется на главном экране
```

**Альтернативный способ:**
```
1. Меню (⋮) → "Установить приложение"
2. Подтвердить установку
```

#### iOS (Safari)
```
1. Открыть в Safari
2. Должна появиться инструкция установки
3. Нажать "Поделиться" (⬆️)
4. Выбрать "На экран «Домой»"
5. Нажать "Добавить"
6. Иконка появляется на главном экране
```

#### Desktop (Chrome/Edge)
```
1. Открыть в Chrome/Edge
2. Иконка установки в адресной строке
3. Нажать на иконку
4. Подтвердить установку
5. Приложение открывается в отдельном окне
```

### Тестирование офлайн режима

#### Базовая проверка
```
1. Открыть приложение
2. Загрузить карту
3. Отключить интернет
4. Обновить страницу
5. Приложение должно работать
```

#### Что должно работать офлайн:
- ✅ Главная страница
- ✅ Карта (последняя загруженная)
- ✅ История зарядок
- ✅ Профиль
- ✅ Навигация

#### Что НЕ должно работать офлайн:
- ❌ Новые маршруты
- ❌ Начало зарядки
- ❌ Пополнение баланса
- ❌ Обновление данных станций

#### Индикатор подключения
```
1. Открыть приложение
2. Отключить интернет
3. Должно появиться красное уведомление "Нет подключения"
4. Включить интернет
5. Должно появиться зеленое уведомление "Соединение восстановлено"
```

### Тестирование обновлений

#### Симуляция обновления
```
1. Открыть приложение
2. DevTools → Application → Service Workers
3. Нажать "Update"
4. Должно появиться уведомление об обновлении
5. Нажать "Обновить"
6. Страница перезагружается
```

### Тестирование компонентов

#### PWAInstallPrompt
```
1. Открыть в Chrome (не установлено)
2. Должен появиться баннер внизу справа
3. Проверить кнопки "Установить" и "Позже"
4. Нажать "Позже"
5. Баннер исчезает
6. localStorage['pwa-install-dismissed'] = 'true'
```

#### IOSInstallPrompt
```
1. Открыть в Safari на iOS
2. Должна появиться инструкция
3. Проверить 3 шага установки
4. Нажать "Понятно"
5. Инструкция исчезает
```

#### OfflineIndicator
```
1. Открыть приложение
2. Отключить интернет
3. Красное уведомление появляется
4. Включить интернет
5. Зеленое уведомление появляется на 3 секунды
```

#### PWAStatus
```
1. Открыть профиль
2. Добавить компонент <PWAStatus />
3. Проверить отображение:
   - Статус установки
   - Режим (Приложение/Браузер)
   - Платформа (iOS/Android/Desktop)
   - Подключение (Онлайн/Офлайн)
   - Размер кэша
```

### Тестирование хуков

#### usePWA()
```typescript
import { usePWA } from '@/app/hooks/usePWA';

const TestComponent = () => {
  const { isInstalled, isStandalone, canInstall, isIOS, isAndroid } = usePWA();
  
  console.log('Installed:', isInstalled);
  console.log('Standalone:', isStandalone);
  console.log('Can Install:', canInstall);
  console.log('iOS:', isIOS);
  console.log('Android:', isAndroid);
  
  return null;
};
```

#### useOnlineStatus()
```typescript
import { useOnlineStatus } from '@/app/hooks/usePWA';

const TestComponent = () => {
  const isOnline = useOnlineStatus();
  
  console.log('Online:', isOnline);
  
  return null;
};
```

#### useBeforeInstallPrompt()
```typescript
import { useBeforeInstallPrompt } from '@/app/hooks/usePWA';

const TestComponent = () => {
  const { canInstall, promptInstall } = useBeforeInstallPrompt();
  
  const handleInstall = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      console.log('Accepted:', accepted);
    }
  };
  
  return canInstall ? (
    <button onClick={handleInstall}>Install</button>
  ) : null;
};
```

### Тестирование кэширования

#### Проверка кэшей
```javascript
// В консоли браузера
caches.keys().then(keys => {
  console.log('Caches:', keys);
  keys.forEach(key => {
    caches.open(key).then(cache => {
      cache.keys().then(requests => {
        console.log(`${key}:`, requests.length, 'items');
      });
    });
  });
});
```

#### Очистка кэшей
```javascript
// В консоли браузера
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('All caches cleared');
});
```

#### Проверка размера кэша
```javascript
// В консоли браузера
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then(({ usage, quota }) => {
    console.log(`Using ${usage} of ${quota} bytes`);
    console.log(`${(usage / quota * 100).toFixed(2)}% used`);
  });
}
```

### Тестирование производительности

#### Первая загрузка
```
1. Очистить кэш браузера
2. DevTools → Network → Disable cache
3. Обновить страницу
4. Записать время загрузки
```

**Ожидаемый результат:** 3-5 секунд

#### Повторная загрузка
```
1. Обновить страницу (кэш включен)
2. Записать время загрузки
```

**Ожидаемый результат:** 0.5-1 секунда

#### Офлайн загрузка
```
1. Отключить интернет
2. Обновить страницу
3. Записать время загрузки
```

**Ожидаемый результат:** Мгновенно

### Тестирование на реальных устройствах

#### Android
```
1. Открыть на Android устройстве
2. Установить приложение
3. Проверить иконку на главном экране
4. Открыть приложение
5. Проверить полноэкранный режим
6. Проверить офлайн режим
```

#### iOS
```
1. Открыть на iPhone/iPad
2. Установить через Safari
3. Проверить иконку на главном экране
4. Открыть приложение
5. Проверить полноэкранный режим
6. Проверить офлайн режим
```

#### Desktop
```
1. Открыть на компьютере
2. Установить приложение
3. Проверить отдельное окно
4. Проверить в списке приложений
5. Проверить офлайн режим
```

### Автоматизированное тестирование

#### Lighthouse CI
```bash
npm install -g @lhci/cli

# Запустить тесты
lhci autorun --collect.url=http://localhost:3000
```

#### Puppeteer тест
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Открыть страницу
  await page.goto('http://localhost:3000');
  
  // Проверить manifest
  const manifest = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]');
    return link ? link.href : null;
  });
  console.log('Manifest:', manifest);
  
  // Проверить Service Worker
  const sw = await page.evaluate(() => {
    return 'serviceWorker' in navigator;
  });
  console.log('Service Worker support:', sw);
  
  await browser.close();
})();
```

## Чеклист тестирования

### Базовые проверки
- [ ] Приложение собирается без ошибок
- [ ] Manifest.json доступен
- [ ] Все иконки сгенерированы
- [ ] Service Worker регистрируется
- [ ] Lighthouse оценка 90+

### Установка
- [ ] Промпт появляется на Android
- [ ] Промпт появляется на Desktop
- [ ] Инструкция появляется на iOS
- [ ] Приложение устанавливается
- [ ] Иконка появляется на главном экране

### Офлайн режим
- [ ] Приложение работает офлайн
- [ ] Индикатор показывает статус
- [ ] Кэш работает корректно
- [ ] Обновления применяются

### Компоненты
- [ ] PWAProvider работает
- [ ] PWAInstallPrompt отображается
- [ ] IOSInstallPrompt отображается
- [ ] OfflineIndicator работает
- [ ] PWAStatus отображается

### Хуки
- [ ] usePWA() возвращает корректные данные
- [ ] useOnlineStatus() работает
- [ ] useBeforeInstallPrompt() работает

### Производительность
- [ ] Первая загрузка < 5 секунд
- [ ] Повторная загрузка < 1 секунды
- [ ] Офлайн загрузка мгновенная

### Кросс-браузерность
- [ ] Chrome (Android) ✅
- [ ] Chrome (Desktop) ✅
- [ ] Edge (Desktop) ✅
- [ ] Safari (iOS) ✅
- [ ] Safari (macOS) ✅
- [ ] Firefox ⚠️

## Известные проблемы

### Firefox
- Ограниченная поддержка PWA
- Нет промпта установки
- Офлайн режим работает

### Safari (старые версии)
- iOS < 14: ограниченная поддержка
- macOS < Big Sur: ограниченная поддержка

## Отладка

### Логирование
```typescript
// Включить подробное логирование
if (process.env.NODE_ENV === 'development') {
  console.log('PWA Debug Mode');
}
```

### Service Worker
```javascript
// Проверить статус
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registrations:', regs);
});

// Проверить контроллер
console.log('Controller:', navigator.serviceWorker.controller);
```

### Manifest
```javascript
// Проверить manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(manifest => console.log('Manifest:', manifest));
```

## Результаты тестирования

После прохождения всех тестов заполните:

```
Дата: ___________
Тестировщик: ___________

Базовые проверки: ✅ / ❌
Установка: ✅ / ❌
Офлайн режим: ✅ / ❌
Компоненты: ✅ / ❌
Хуки: ✅ / ❌
Производительность: ✅ / ❌
Кросс-браузерность: ✅ / ❌

Комментарии:
___________
```

---

**Успешного тестирования!** 🧪
