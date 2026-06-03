# 📊 Руководство по логированию

## Добавленные логи для диагностики

### 🔐 Google OAuth логи

#### В `app/auth/signin/page.tsx`:

**Попытка входа через Google:**
```
🔐 [SIGNIN] Starting Google sign in: { callbackUrl, timestamp, userAgent }
✅ [SIGNIN] Google sign in result: { result }
❌ [SIGNIN] Google sign in error: { error, message, stack, timestamp }
```

**Статус аутентификации:**
```
🔍 [AUTH STATUS] { status, callbackUrl, timestamp }
✅ [SIGNIN] User authenticated, redirecting to: { callbackUrl, timestamp }
ℹ️ [SIGNIN] User not authenticated
⏳ [SIGNIN] Auth status loading...
```

#### В `lib/auth-config.ts`:

**Callback при входе через Google:**
```
🔐 [GOOGLE] OAuth login attempt: { email, name, provider, timestamp }
📝 [GOOGLE] Creating new user: { email, name, timestamp }
✅ [GOOGLE] User created: { email, userId, timestamp }
✅ [GOOGLE] User balance created: { email, userId, timestamp }
✅ [GOOGLE] Existing user login: { email, userId, role, status, timestamp }
📧 [GOOGLE] Login notification sent: { email, timestamp }
❌ [GOOGLE] Failed to send login notification: { error, message, timestamp }
✅ [GOOGLE] Login successful: { email, userId, timestamp }
❌ [GOOGLE] Error in signIn callback: { error, message, stack, email, timestamp }
❌ [GOOGLE] Admin trying to login via Google: { email, role, timestamp }
```

**JWT токены:**
```
🔑 [JWT] Creating/updating token: { hasUser, hasAccount, trigger, provider, email, timestamp }
✅ [JWT] Token updated with user data: { userId, role, email, timestamp }
🔍 [JWT] Fetching user data for Google OAuth: { email, timestamp }
✅ [JWT] Google OAuth token enriched: { userId, role, email, timestamp }
❌ [JWT] User not found in database after Google OAuth: { email, timestamp }
```

**Сессии:**
```
✅ [SESSION] Session created: { userId, email, role, timestamp }
```

---

### 🔑 Credentials (Email/Password) логи

**Попытка входа:**
```
🔐 [CREDENTIALS] Login attempt: { email, timestamp }
📊 [CREDENTIALS] Login result: { ok, status, error, timestamp }
❌ [CREDENTIALS] Login error: { error }
✅ [CREDENTIALS] Login successful, redirecting to: { callbackUrl }
```

**На сервере (в `lib/auth-config.ts`):**
```
🔐 [CREDENTIALS] Login attempt: { email, timestamp }
❌ [CREDENTIALS] Missing credentials
❌ [CREDENTIALS] User not found: { email }
✅ [CREDENTIALS] User found: { email, role, hasPassword }
❌ [CREDENTIALS] Admin trying to login via user endpoint: { email }
❌ [CREDENTIALS] Google account, no password: { email }
🔒 [CREDENTIALS] Account locked: { email, minutesLeft }
🚫 [CREDENTIALS] Account blocked by admin: { email }
❌ [CREDENTIALS] Invalid password: { email, attempts }
🔒 [CREDENTIALS] Account locked due to failed attempts: { email }
✅ [CREDENTIALS] Password valid, resetting login attempts: { email }
✅ [CREDENTIALS] Login successful: { email, userId }
```

---

### 📝 Регистрация логи

**В `app/auth/signin/page.tsx`:**

```
📝 [REGISTER] Registration attempt: { email, name, timestamp }
📊 [REGISTER] Registration response: { ok, status, data, timestamp }
❌ [REGISTER] Registration error: { data }
✅ [REGISTER] Registration successful, sending verification code
📊 [REGISTER] Code sending response: { ok, status, timestamp }
❌ [REGISTER] Code sending error: { data }
✅ [REGISTER] Code sent, redirecting to verification
```

---

### 🔧 Service Worker логи

**В `app/components/ServiceWorkerLogger.tsx`:**

**Проверка поддержки:**
```
⚠️ [SW] Service Worker not supported in this browser
🔍 [SW] Service Worker support detected
```

**Статус регистрации:**
```
✅ [SW] Service Worker already registered: { scope, state, updateViaCache, timestamp }
ℹ️ [SW] No Service Worker registered yet
```

**Попытка регистрации:**
```
🚀 [SW] Attempting to register Service Worker: { url, options, timestamp }
✅ [SW] Service Worker registered successfully: { scope, installing, waiting, active, timestamp }
❌ [SW] Service Worker registration failed: { error, message, name, stack, url, timestamp }
```

**Ошибка 404:**
```
🔍 [SW] 404 Error - Service Worker file not found: {
  expectedUrl,
  suggestion: 'Run "npm run build" with NODE_ENV=production to generate sw.js',
  timestamp
}
```

**События:**
```
🔄 [SW] Service Worker update found
📊 [SW] New Service Worker state: { state, timestamp }
🔄 [SW] Controller changed - new Service Worker activated
📨 [SW] Message from Service Worker: { data, origin, timestamp }
❌ [SW] Error checking Service Worker registration: { error, message, stack, timestamp }
```

---

## 🔍 Как использовать логи для диагностики

### 1. Проблемы с Google OAuth

Откройте DevTools (F12) → Console и ищите:

**Если бесконечная загрузка:**
```
🔐 [SIGNIN] Starting Google sign in
🔐 [GOOGLE] OAuth login attempt
❌ [GOOGLE] Error in signIn callback  ← СМОТРИТЕ ЗДЕСЬ
```

**Если не создается пользователь:**
```
📝 [GOOGLE] Creating new user
❌ [GOOGLE] User created  ← Если ошибка - проблема с БД
```

**Если админ пытается войти через Google:**
```
❌ [GOOGLE] Admin trying to login via Google
```

### 2. Проблемы с входом по Email/Password

**Неверный пароль:**
```
❌ [CREDENTIALS] Invalid password: { email, attempts }
```

**Аккаунт заблокирован:**
```
🔒 [CREDENTIALS] Account locked: { email, minutesLeft }
```

**Попытка входа с Google аккаунтом:**
```
❌ [CREDENTIALS] Google account, no password
```

### 3. Проблемы с Service Worker (404)

**В консоли браузера ищите:**
```
❌ [SW] Service Worker registration failed
🔍 [SW] 404 Error - Service Worker file not found
```

**Решение:**
```bash
export NODE_ENV=production
npm run build
pm2 restart all
```

### 4. Проблемы с сессией

**Если пользователь не остается залогиненным:**
```
✅ [SESSION] Session created  ← Должно быть после входа
🔑 [JWT] Creating/updating token  ← Проверьте, что токен создается
```

---

## 📝 Логи на сервере

### Просмотр логов на сервере:

```bash
# Если используете PM2
pm2 logs chargeflow --lines 100

# Если используете Docker
docker logs chargeflow-app --tail 100 -f

# Если используете systemd
journalctl -u chargeflow -n 100 -f
```

### Фильтрация логов:

```bash
# Только Google OAuth
pm2 logs | grep "\[GOOGLE\]"

# Только ошибки
pm2 logs | grep "❌"

# Только Service Worker
pm2 logs | grep "\[SW\]"

# Только успешные операции
pm2 logs | grep "✅"
```

---

## 🚨 Типичные ошибки и их логи

### Ошибка: "invalid_grant (Bad Request)"
**Логи:**
```
❌ [GOOGLE] Error in signIn callback: invalid_grant
```
**Решение:** Проверьте Redirect URI в Google Cloud Console

### Ошибка: "Service Worker 404"
**Логи:**
```
❌ [SW] Service Worker registration failed
🔍 [SW] 404 Error - Service Worker file not found
```
**Решение:** Пересоберите с NODE_ENV=production

### Ошибка: "User not found in database"
**Логи:**
```
❌ [JWT] User not found in database after Google OAuth
```
**Решение:** Проблема с созданием пользователя, проверьте БД

### Ошибка: "Account locked"
**Логи:**
```
🔒 [CREDENTIALS] Account locked: { email, minutesLeft }
```
**Решение:** Подождите или сбросьте счетчик в БД

---

## 💡 Советы

1. **Всегда держите консоль браузера открытой** при тестировании OAuth
2. **Используйте фильтрацию** в консоли DevTools (например, введите "[GOOGLE]")
3. **Сохраняйте логи** при возникновении проблем (правый клик → Save as)
4. **Включите сохранение логов** в DevTools (Settings → Preserve log)
5. **Используйте timestamps** для отслеживания последовательности событий

---

## 🔧 Отключение логов в production

Если хотите отключить детальные логи в production, добавьте в `.env`:

```env
NEXT_PUBLIC_DEBUG_LOGS=false
```

И оберните console.log в условие:
```typescript
if (process.env.NEXT_PUBLIC_DEBUG_LOGS !== 'false') {
  console.log('...');
}
```

Но для начальной диагностики **рекомендуется оставить логи включенными**.
