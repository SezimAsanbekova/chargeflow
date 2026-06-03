# 🔄 Пересборка приложения для исправления Service Worker

## ❌ Проблема
```
Failed to register a ServiceWorker: 404 - sw.js not found
```

Service Worker не был сгенерирован при сборке, потому что:
- PWA генерируется только при `NODE_ENV=production`
- Возможно приложение собиралось в development режиме

## ✅ Решение: Пересборка в production режиме

### На сервере выполните:

```bash
# 1. Остановите приложение
pm2 stop all
# или если используете docker
docker-compose down

# 2. Установите переменную окружения
export NODE_ENV=production

# 3. Очистите старую сборку
rm -rf .next
rm -rf public/sw.js
rm -rf public/workbox-*.js

# 4. Пересоберите приложение
npm run build

# 5. Проверьте, что sw.js создан
ls -la public/sw.js
ls -la public/workbox-*.js

# 6. Запустите приложение
pm2 start npm --name "chargeflow" -- start
# или
docker-compose up -d

# 7. Проверьте логи
pm2 logs chargeflow --lines 20
```

### Проверка успешной сборки:

После `npm run build` вы должны увидеть:
```
✓ Compiled successfully
✓ PWA: Service worker generated
```

И в папке `public/` должны появиться файлы:
- `sw.js`
- `workbox-*.js`
- `sw.js.map`

---

## 🔧 Альтернатива: Временно отключить PWA

Если PWA не нужен сейчас, можно отключить:

```bash
# Добавьте в .env на сервере
echo "DISABLE_PWA=true" >> .env

# Пересоберите
npm run build

# Перезапустите
pm2 restart all
```

Это уберет ошибку, но приложение не будет работать как PWA (не установится на домашний экран).

---

## ✅ После пересборки

1. **Очистите кэш браузера:**
   - Откройте DevTools (F12)
   - Application → Storage → Clear site data
   - Или откройте incognito окно

2. **Проверьте Service Worker:**
   - Откройте DevTools (F12)
   - Application → Service Workers
   - Должен быть зарегистрирован sw.js со статусом "activated"

3. **Проверьте работу PWA:**
   - В Chrome/Edge на мобильном должна появиться кнопка "Установить приложение"
   - На десктопе в адресной строке справа появится иконка установки

---

## 🐛 Если проблема сохраняется

Проверьте, что в `.env` на сервере:
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://sezimasanbekova-chargeflow-003a.twc1.net
```

И посмотрите логи сборки:
```bash
npm run build 2>&1 | tee build.log
cat build.log | grep -i pwa
```
