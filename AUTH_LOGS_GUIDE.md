# 📋 Руководство по логам авторизации и регистрации

## 🎯 Обзор

Все процессы авторизации и регистрации теперь логируются с использованием эмодзи-префиксов для удобной фильтрации и мониторинга.

## 📝 Типы логов

### 1. **Регистрация** `[REGISTER]`

**Файл:** `/app/api/auth/register/route.ts`

#### Успешная регистрация:
```
📝 [REGISTER] Registration attempt: { email, hasName, timestamp }
✅ [REGISTER] Password validation passed: { email }
✅ [REGISTER] Email available, creating user: { email }
✅ [REGISTER] User created: { email, userId }
✅ [REGISTER] User balance created: { email, userId }
🎉 [REGISTER] Registration successful: { email, userId, name }
```

#### Ошибки регистрации:
```
❌ [REGISTER] Missing credentials: { email: boolean, password: boolean }
❌ [REGISTER] Password validation failed: { email, errors }
❌ [REGISTER] User already exists: { email }
❌ [REGISTER] Registration error: error
```

---

### 2. **Авторизация (отправка кода)** `[AUTH]`

**Файл:** `/app/api/auth/send-code/route.ts`

#### Успешная отправка кода:
```
🔐 [AUTH] Login attempt: { email, type, timestamp }
✅ [AUTH] User found: { email, role, status, loginAttempts }
✅ [AUTH] Password valid, sending verification code: { email }
✅ [AUTH] Verification code sent successfully: { email, type }
```

#### Ошибки авторизации:
```
❌ [AUTH] Missing credentials: { email: boolean, password: boolean }
❌ [AUTH] User not found or no password: { email, exists, hasPassword }
❌ [AUTH] Admin trying to login via user endpoint: { email }
🔒 [AUTH] Account locked: { email, minutesLeft, lockedUntil }
🚫 [AUTH] Account blocked by admin: { email }
❌ [AUTH] Invalid password: { email, attempts, maxAttempts }
🔒 [AUTH] Account locked due to failed attempts: { email, lockedUntil }
❌ [AUTH] Failed to send verification code: { email, error }
```

---

### 3. **Подтверждение кода** `[AUTH]`

**Файл:** `/app/api/auth/verify-code/route.ts`

#### Успешное подтверждение:
```
🔑 [AUTH] Verify code attempt: { email, type, skipMarkAsUsed, timestamp }
✅ [AUTH] Verification code valid: { email }
✅ [AUTH] User authenticated: { email, userId, role }
✅ [AUTH] Login attempts reset: { email, userId }
📧 [AUTH] Login notification sent: { email }
✅ [AUTH] Login successful: { email, userId, role }
```

#### Ошибки подтверждения:
```
❌ [AUTH] Missing email or code: { email: boolean, code: boolean }
❌ [AUTH] Invalid verification code: { email, error }
❌ [AUTH] User not found after verification: { email }
❌ [AUTH] Admin trying to verify via user endpoint: { email }
❌ [AUTH] Failed to send login notification: error
```

---

### 4. **Google OAuth** `[GOOGLE]`

**Файл:** `/lib/auth-config.ts`

#### Успешный вход через Google:
```
🔐 [GOOGLE] OAuth login attempt: { email, timestamp }
📝 [GOOGLE] Creating new user: { email }
✅ [GOOGLE] User created: { email, userId }
✅ [GOOGLE] User balance created: { email, userId }
✅ [GOOGLE] Existing user login: { email, userId }
📧 [GOOGLE] Login notification sent: { email }
✅ [GOOGLE] Login successful: { email, userId }
```

#### Ошибки Google OAuth:
```
❌ [GOOGLE] Admin trying to login via Google: { email }
❌ [GOOGLE] Failed to send login notification: error
❌ [GOOGLE] Error in signIn callback: error
```

---

### 5. **Credentials Provider** `[CREDENTIALS]`

**Файл:** `/lib/auth-config.ts`

#### Успешный вход через credentials:
```
🔐 [CREDENTIALS] Login attempt: { email, timestamp }
✅ [CREDENTIALS] User found: { email, role, hasPassword }
✅ [CREDENTIALS] Password valid, resetting login attempts: { email }
✅ [CREDENTIALS] Login successful: { email, userId }
```

#### Ошибки credentials:
```
❌ [CREDENTIALS] Missing credentials
❌ [CREDENTIALS] User not found: { email }
❌ [CREDENTIALS] Admin trying to login via user endpoint: { email }
❌ [CREDENTIALS] Google account, no password: { email }
🔒 [CREDENTIALS] Account locked: { email, minutesLeft }
🚫 [CREDENTIALS] Account blocked by admin: { email }
❌ [CREDENTIALS] Invalid password: { email, attempts }
🔒 [CREDENTIALS] Account locked due to failed attempts: { email }
```

---

### 6. **Админ-панель** `[ADMIN]`

**Файл:** `/app/api/admin/send-code/route.ts`

#### Успешный вход админа:
```
🔐 Admin login attempt: { email }
✅ User found: { email, role, hasPassword }
✅ Password valid, sending verification code...
✅ Verification code sent successfully
```

#### Ошибки админа:
```
❌ Missing email or password
❌ User not found: email
❌ User is not admin: { email, role }
❌ Password not set for user: email
❌ Invalid password for user: email
❌ Failed to send verification code: error
❌ Error in admin send-code: error
```

---

## 🔍 Как использовать логи

### Фильтрация по типу операции:
```bash
# Все регистрации
grep "\[REGISTER\]" logs

# Все попытки входа
grep "\[AUTH\]" logs

# Google OAuth
grep "\[GOOGLE\]" logs

# Credentials авторизация
grep "\[CREDENTIALS\]" logs
```

### Фильтрация по статусу:
```bash
# Успешные операции
grep "✅" logs

# Ошибки
grep "❌" logs

# Блокировки
grep "🔒" logs

# Новые регистрации
grep "🎉" logs
```

### Фильтрация по email:
```bash
grep "user@example.com" logs
```

---

## 📊 Эмодзи-легенда

| Эмодзи | Значение |
|--------|----------|
| 🔐 | Попытка входа |
| 📝 | Регистрация |
| ✅ | Успешная операция |
| ❌ | Ошибка |
| 🔒 | Блокировка аккаунта |
| 🚫 | Блокировка администратором |
| 📧 | Отправка email |
| 🔑 | Проверка кода |
| 🎉 | Успешная регистрация |

---

## 🛠️ Примеры использования

### Мониторинг неудачных попыток входа:
```bash
grep "❌.*Invalid password" logs | tail -20
```

### Отслеживание блокировок:
```bash
grep "🔒.*Account locked" logs
```

### Просмотр всех регистраций за сегодня:
```bash
grep "\[REGISTER\].*Registration successful" logs | grep "$(date +%Y-%m-%d)"
```

### Проверка Google OAuth входов:
```bash
grep "\[GOOGLE\].*Login successful" logs
```

---

## 🔧 Настройка

Все логи выводятся в `console.log` и `console.error`. Для продакшена рекомендуется настроить:

1. **Winston** или **Pino** для структурированного логирования
2. **Log rotation** для управления размером файлов
3. **Centralized logging** (ELK Stack, CloudWatch, etc.)
4. **Alerts** на критические события (блокировки, множественные ошибки)

---

## 📈 Метрики для мониторинга

1. **Количество регистраций** - `grep "🎉 \[REGISTER\]" | wc -l`
2. **Неудачные попытки входа** - `grep "❌.*Invalid password" | wc -l`
3. **Блокировки аккаунтов** - `grep "🔒.*Account locked" | wc -l`
4. **Google OAuth входы** - `grep "\[GOOGLE\].*Login successful" | wc -l`
5. **Ошибки отправки email** - `grep "❌.*Failed to send" | wc -l`
