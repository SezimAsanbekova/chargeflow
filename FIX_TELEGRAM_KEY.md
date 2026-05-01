# 🔧 Исправление ключа Telegram

## Проблема

В базе данных ключ `ADMIN_TELEGRAM_BOT_TOKEN` имеет **лишний пробел в конце**:

```
"ADMIN_TELEGRAM_BOT_TOKEN "  ← пробел в конце
```

Код ищет ключ без пробела:
```
"ADMIN_TELEGRAM_BOT_TOKEN"   ← без пробела
```

## Решение

### Вариант 1: Обновить ключ (рекомендуется)

```sql
-- Обновляем ключ, убирая пробел
UPDATE settings 
SET key = 'ADMIN_TELEGRAM_BOT_TOKEN'
WHERE key = 'ADMIN_TELEGRAM_BOT_TOKEN ';

-- Проверка
SELECT key, value FROM settings WHERE key = 'ADMIN_TELEGRAM_BOT_TOKEN';
```

### Вариант 2: Удалить и создать заново

```sql
-- Удаляем запись с пробелом
DELETE FROM settings WHERE key = 'ADMIN_TELEGRAM_BOT_TOKEN ';

-- Добавляем правильную запись
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  '8597691521:AAHnxT5vl5uA2hb2clP5nGvj-6S7ripoP_I',
  NOW()
);
```

## Проверка

После исправления выполните:

```sql
SELECT 
  key,
  LENGTH(key) as key_length,
  LEFT(value, 20) || '...' as token_preview,
  CASE 
    WHEN key = 'ADMIN_TELEGRAM_BOT_TOKEN' THEN '✅ Правильно'
    ELSE '❌ Есть пробел'
  END as status
FROM settings 
WHERE key LIKE 'ADMIN_TELEGRAM_BOT_TOKEN%';
```

**Ожидаемый результат:**
- key = `ADMIN_TELEGRAM_BOT_TOKEN` (без пробела)
- key_length = `24`
- status = `✅ Правильно`

## После исправления

1. Перезапустите сервер:
```bash
npm run dev
```

2. Попробуйте войти снова

3. Проверьте логи - должно быть:
```
✅ Bot token found
📤 Calling Telegram API...
✅ Telegram API response: { ok: true, ... }
✅ Message sent successfully
```

## Готово! ✅

После исправления ключа код должен отправиться в Telegram.
