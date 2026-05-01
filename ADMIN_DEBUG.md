# 🔍 Отладка админ-панели

## Проблема: Код не отправляется (403/500 ошибка)

### Шаг 1: Проверьте логи сервера

Откройте терминал где запущен `npm run dev` и посмотрите на логи.

### Возможные ошибки и решения

#### ❌ "User not found"
**Проблема:** Пользователь с таким email не существует

**Решение:**
```sql
-- Проверьте, существует ли пользователь
SELECT id, email, role FROM users WHERE email = 'ваш_email@example.com';

-- Если нет, создайте:
INSERT INTO users (id, email, name, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Администратор',
  '$2a$10$...',  -- Хеш пароля
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
);
```

#### ❌ "User is not an admin"
**Проблема:** Роль пользователя не 'admin'

**Решение:**
```sql
-- Проверьте роль
SELECT email, role FROM users WHERE email = 'ваш_email@example.com';

-- Обновите роль
UPDATE users SET role = 'admin' WHERE email = 'ваш_email@example.com';
```

#### ❌ "Password not set for this user"
**Проблема:** У пользователя нет пароля (passwordHash = null)

**Решение:**
```bash
# Сгенерируйте хеш пароля
node scripts/generate-password-hash.js "ваш_пароль"

# Обновите в БД
UPDATE users 
SET password_hash = '$2a$10$...'  -- Хеш из команды выше
WHERE email = 'ваш_email@example.com';
```

#### ❌ "Invalid password"
**Проблема:** Неверный пароль

**Решение:**
- Убедитесь, что вводите правильный пароль
- Или сгенерируйте новый хеш и обновите в БД

#### ❌ "Admin Telegram ID not configured"
**Проблема:** Telegram ID не настроен в таблице settings

**Решение:**
```sql
-- Проверьте настройки
SELECT key, value FROM settings WHERE key = 'ADMIN_TELEGRAM_USER_ID';

-- Если нет, добавьте:
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  'ВАШ_TELEGRAM_ID',  -- Получите через @userinfobot
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

#### ❌ "Telegram bot token not found"
**Проблема:** Токен бота не настроен в таблице settings

**Решение:**
```sql
-- Проверьте настройки
SELECT key, value FROM settings WHERE key = 'ADMIN_TELEGRAM_BOT_TOKEN';

-- Если нет, добавьте:
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'ВАШ_ТОКЕН_БОТА',  -- Получите через @BotFather
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

#### ❌ "Telegram API error"
**Проблема:** Ошибка при отправке сообщения через Telegram API

**Возможные причины:**
1. Неверный токен бота
2. Неверный Telegram ID
3. Бот не начал диалог с пользователем

**Решение:**
```bash
# 1. Проверьте токен бота
# Откройте @BotFather и получите токен заново

# 2. Проверьте Telegram ID
# Откройте @userinfobot и получите свой ID

# 3. Начните диалог с ботом
# Найдите бота в Telegram и отправьте /start
```

## Полная проверка настроек

### 1. Проверка пользователя

```sql
SELECT 
  id,
  email,
  name,
  role,
  status,
  CASE WHEN password_hash IS NULL THEN 'НЕТ' ELSE 'ДА' END as has_password
FROM users 
WHERE email = 'ваш_email@example.com';
```

**Ожидаемый результат:**
- role = 'admin'
- status = 'active'
- has_password = 'ДА'

### 2. Проверка настроек Telegram

```sql
SELECT key, 
       CASE 
         WHEN key = 'ADMIN_TELEGRAM_BOT_TOKEN' THEN CONCAT(LEFT(value, 10), '...')
         ELSE value 
       END as value
FROM settings 
WHERE key IN ('ADMIN_TELEGRAM_USER_ID', 'ADMIN_TELEGRAM_BOT_TOKEN');
```

**Ожидаемый результат:**
- ADMIN_TELEGRAM_USER_ID = ваш Telegram ID (цифры)
- ADMIN_TELEGRAM_BOT_TOKEN = токен бота (начинается с цифр)

### 3. Тест отправки сообщения

Создайте тестовый скрипт `test-telegram.js`:

```javascript
const fetch = require('node-fetch');

const BOT_TOKEN = 'ВАШ_ТОКЕН_БОТА';
const CHAT_ID = 'ВАШ_TELEGRAM_ID';

async function testTelegram() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: '🧪 Тестовое сообщение',
    }),
  });

  const result = await response.json();
  console.log('Result:', result);
}

testTelegram();
```

Запустите:
```bash
node test-telegram.js
```

Если получили сообщение в Telegram → настройки правильные ✅

## Пошаговая настройка с нуля

### 1. Создайте Telegram бота

```
1. Откройте @BotFather в Telegram
2. Отправьте /newbot
3. Следуйте инструкциям
4. Сохраните токен (например: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
```

### 2. Получите Telegram ID

```
1. Откройте @userinfobot в Telegram
2. Отправьте любое сообщение
3. Сохраните ID (например: 123456789)
```

### 3. Начните диалог с ботом

```
1. Найдите вашего бота в Telegram (по имени из шага 1)
2. Отправьте /start
```

### 4. Создайте администратора

```bash
# Сгенерируйте хеш пароля
node scripts/generate-password-hash.js "Admin123!"
```

```sql
-- Создайте пользователя
INSERT INTO users (id, email, name, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Администратор',
  '$2a$10$...',  -- Хеш из команды выше
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
);

-- Создайте баланс
INSERT INTO user_balance (user_id, balance, updated_at)
SELECT id, 0, NOW()
FROM users
WHERE email = 'admin@example.com';
```

### 5. Добавьте настройки Telegram

```sql
-- Telegram ID
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  '123456789',  -- Ваш ID из шага 2
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Токен бота
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',  -- Токен из шага 1
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### 6. Проверьте

```bash
# Перезапустите сервер
npm run dev
```

Откройте `http://localhost:3000/admin/signin` и попробуйте войти.

## Логи для отладки

Теперь в логах сервера вы увидите:

```
🔐 Admin login attempt: { email: 'admin@example.com' }
✅ User found: { email: 'admin@example.com', role: 'admin', hasPassword: true }
✅ Password valid, sending verification code...
📱 Sending admin verification code for: admin@example.com
✅ Telegram ID found: 123456789
✅ Verification code generated: 123456
✅ Code saved to database
📤 Sending message to Telegram...
📱 Sending Telegram message to chat: 123456789
✅ Bot token found
📤 Calling Telegram API...
✅ Telegram API response: { ok: true, result: {...} }
✅ Message sent successfully
✅ Verification code sent successfully
```

Если видите ❌ - смотрите сообщение об ошибке и исправляйте.

## Готово! ✅

После исправления всех ошибок вход должен работать.

**Нужна помощь?** Покажите логи из терминала.
