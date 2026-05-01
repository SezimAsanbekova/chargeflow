# 🔐 Быстрая настройка пароля администратора

## Шаг 1: Сгенерируйте хеш пароля

```bash
node scripts/generate-password-hash.js "ваш_пароль"
```

**Пример:**
```bash
node scripts/generate-password-hash.js "Admin123!"
```

**Результат:**
```
✅ Хеш сгенерирован:

$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP

📋 SQL для обновления пароля:

UPDATE users
SET password_hash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP'
WHERE email = 'admin@example.com' AND role = 'admin';
```

## Шаг 2: Обновите пароль в базе данных

Скопируйте SQL из результата и выполните в вашей БД.

**Или создайте нового администратора:**

```sql
-- Замените EMAIL, ИМЯ и ХЕШ_ПАРОЛЯ
INSERT INTO users (id, email, name, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',  -- ВАШ EMAIL
  'Администратор',      -- ВАШЕ ИМЯ
  '$2a$10$...',         -- ХЕШ ИЗ ШАГА 1
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
);

-- Создать баланс
INSERT INTO user_balance (user_id, balance, updated_at)
SELECT id, 0, NOW()
FROM users
WHERE email = 'admin@example.com';
```

## Шаг 3: Настройте Telegram (если еще не настроено)

```sql
-- Telegram ID администратора
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  'ВАШ_TELEGRAM_ID',  -- Получите через @userinfobot
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Токен Telegram бота
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'ВАШ_ТОКЕН_БОТА',  -- Получите через @BotFather
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## Шаг 4: Войдите

1. Откройте `http://localhost:3000/admin/signin`
2. Введите email
3. Введите пароль (тот, что использовали в Шаге 1)
4. Получите код в Telegram
5. Введите код
6. Готово! 🎉

## Готово! ✅

Теперь вход использует:
- ✅ Email + Пароль
- ✅ Код из Telegram (2FA)

---

**Подробнее:** [ADMIN_PASSWORD_UPDATE.md](./ADMIN_PASSWORD_UPDATE.md)
