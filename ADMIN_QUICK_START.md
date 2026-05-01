# 🚀 Быстрый старт админ-панели

## Шаг 1: Создайте Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните токен (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Получите ваш Telegram ID

1. Откройте [@userinfobot](https://t.me/userinfobot)
2. Отправьте любое сообщение
3. Сохраните ваш ID (например: `123456789`)

## Шаг 3: Настройте базу данных

### Создайте администратора

```sql
-- Создаем пользователя-администратора
INSERT INTO users (id, email, name, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',  -- Замените на ваш email
  'Администратор',
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
);

-- Создаем баланс
INSERT INTO user_balance (user_id, balance, updated_at)
SELECT id, 0, NOW()
FROM users
WHERE email = 'admin@example.com';
```

### Добавьте настройки Telegram

```sql
-- Токен бота
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'ВАШ_ТОКЕН_БОТА',  -- Замените на токен из шага 1
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Ваш Telegram ID
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  'ВАШ_TELEGRAM_ID',  -- Замените на ID из шага 2
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

Или используйте скрипт:

```bash
# 1. Отредактируйте prisma/seed-admin.ts
# 2. Замените YOUR_TELEGRAM_BOT_TOKEN_HERE и YOUR_TELEGRAM_USER_ID_HERE
# 3. Запустите:
npm run db:seed:admin
```

## Шаг 4: Добавьте переменную окружения

В файл `.env`:

```env
JWT_SECRET="ваш_секретный_ключ_минимум_32_символа"
```

## Шаг 5: Начните диалог с ботом

1. Найдите вашего бота в Telegram
2. Отправьте `/start`

## Шаг 6: Войдите в админ-панель

1. Откройте `http://localhost:3000/admin/signin`
2. Введите email администратора
3. Введите ваш Telegram ID
4. Получите код в Telegram
5. Введите код
6. Готово! 🎉

## Проверка

Убедитесь, что:

- ✅ Бот создан и активен
- ✅ Вы знаете свой Telegram ID
- ✅ Администратор создан в базе данных
- ✅ Настройки добавлены в таблицу `settings`
- ✅ JWT_SECRET добавлен в `.env`
- ✅ Вы начали диалог с ботом

## Возможные проблемы

### Код не приходит

- Проверьте токен бота в базе данных
- Убедитесь, что начали диалог с ботом (`/start`)

### "Invalid Telegram ID"

- Проверьте, что ID введен правильно (только цифры)
- Убедитесь, что ID совпадает с тем, что в базе данных

### "User is not an admin"

```sql
-- Проверьте роль пользователя
SELECT email, role FROM users WHERE email = 'admin@example.com';

-- Обновите роль
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Готово!

Теперь вы можете управлять системой через админ-панель:

- 👥 Управление пользователями
- 📍 Управление станциями
- 📅 Просмотр бронирований
- 📊 Аналитика
- ⚙️ Настройки системы

Подробная документация: [ADMIN_SETUP.md](./ADMIN_SETUP.md)
