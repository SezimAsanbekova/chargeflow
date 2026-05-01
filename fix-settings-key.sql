-- Исправление ключа с лишним пробелом

-- Удаляем запись с пробелом
DELETE FROM settings WHERE key = 'ADMIN_TELEGRAM_BOT_TOKEN ';

-- Добавляем правильную запись (без пробела)
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  '8597691521:AAHnxT5vl5uA2hb2clP5nGvj-6S7ripoP_I',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Проверка
SELECT key, 
       LENGTH(key) as key_length,
       value,
       CASE 
         WHEN key = 'ADMIN_TELEGRAM_BOT_TOKEN' THEN '✅ Правильно'
         ELSE '❌ Неправильно'
       END as status
FROM settings 
WHERE key LIKE 'ADMIN_TELEGRAM_BOT_TOKEN%';
