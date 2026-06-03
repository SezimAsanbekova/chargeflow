# ⚡ Быстрая диагностика ошибок

## 🔍 Как проверить логи

### В браузере (Chrome/Safari/Edge):
1. Нажмите **F12** (или Cmd+Option+I на Mac)
2. Перейдите на вкладку **Console**
3. Попробуйте войти/зарегистрироваться
4. Смотрите логи с эмоджи:
   - 🔐 = Google OAuth
   - 🔑 = Credentials (email/password)
   - 🔧 = Service Worker
   - ✅ = Успех
   - ❌ = Ошибка

### На сервере:
```bash
# PM2
pm2 logs --lines 50

# Docker
docker logs <container_name> --tail 50 -f
```

---

## 🚨 Частые проблемы и решения

### 1. Google OAuth - бесконечная загрузка

**Ищите в консоли:**
```
❌ [GOOGLE] Error in signIn callback: invalid_grant
```

**Решение:**
1. Откройте [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Найдите ваш OAuth 2.0 Client ID
3. Добавьте Redirect URI:
   ```
   https://sezimasanbekova-chargeflow-003a.twc1.net/api/auth/callback/google
   ```
4. Сохраните
5. Подождите 1-2 минуты
6. Очистите cookies (DevTools → Application → Clear site data)
7. Попробуйте снова

---

### 2. Service Worker - 404 ошибка

**Ищите в консоли:**
```
❌ [SW] Service Worker registration failed
🔍 [SW] 404 Error - Service Worker file not found
```

**Решение на сервере:**
```bash
# Подключитесь к серверу через SSH
ssh your-username@your-server-ip

# Перейдите в папку проекта
cd /path/to/chargeflow

# Выполните:
export NODE_ENV=production
rm -rf .next
npm run build
pm2 restart all
```

**Или временно отключите PWA:**
```bash
# В .env файле добавьте:
echo "DISABLE_PWA=true" >> .env

# Пересоберите
npm run build
pm2 restart all
```

---

### 3. Не работает вход по email/password

**Ищите в консоли:**
```
❌ [CREDENTIALS] Invalid password: { attempts }
🔒 [CREDENTIALS] Account locked: { minutesLeft }
❌ [CREDENTIALS] Google account, no password
```

**Решения:**

**Неверный пароль:**
- Проверьте правильность пароля
- После 5 неудачных попыток аккаунт блокируется на 1 час

**Аккаунт создан через Google:**
- Используйте кнопку "Войти через Google"
- Email/password не работает для Google аккаунтов

**Аккаунт заблокирован:**
- Подождите указанное время
- Или сбросьте блокировку в БД

---

### 4. Пользователь не остается залогиненным

**Ищите в консоли:**
```
✅ [SESSION] Session created
🔑 [JWT] Token updated with user data
```

**Если этих логов нет:**
- Проблема с cookies
- Проверьте, что `NEXTAUTH_URL` правильный в `.env`
- Проверьте, что `NEXTAUTH_SECRET` установлен

---

## 📋 Чек-лист перед диагностикой

- [ ] DevTools Console открыта (F12)
- [ ] Preserve log включен (DevTools → Settings)
- [ ] Incognito/Private окно (для чистого теста)
- [ ] Network tab открыта (для проверки запросов)
- [ ] Записываете скриншоты/логи

---

## 🔑 Важные переменные окружения

Проверьте на сервере:
```bash
echo $NODE_ENV              # Должно быть: production
echo $NEXTAUTH_URL          # Должно быть: https://your-domain.com
echo $GOOGLE_CLIENT_ID      # Должно быть установлено
echo $NEXTAUTH_SECRET       # Должно быть установлено
```

---

## 📞 Куда смотреть дальше

- **Полное руководство:** `LOGGING_GUIDE.md`
- **Google OAuth:** `GOOGLE_OAUTH_FIX.md`
- **Service Worker:** `REBUILD_FOR_PWA.md`
