# ✅ Чеклист настройки админ-панели

Следуйте этому чеклисту для настройки админ-панели ChargeFlow.

## 📋 Шаг 1: Telegram бот

- [ ] Открыл [@BotFather](https://t.me/BotFather) в Telegram
- [ ] Отправил команду `/newbot`
- [ ] Следовал инструкциям и создал бота
- [ ] Сохранил токен бота (формат: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Токен бота:** `_______________________________________`

## 📋 Шаг 2: Telegram ID

- [ ] Открыл [@userinfobot](https://t.me/userinfobot) в Telegram
- [ ] Отправил любое сообщение
- [ ] Получил и сохранил свой Telegram ID (формат: `123456789`)

**Мой Telegram ID:** `_______________________________________`

## 📋 Шаг 3: База данных

### Вариант A: SQL (рекомендуется)

- [ ] Открыл pgAdmin или другой SQL клиент
- [ ] Подключился к базе данных ChargeFlow
- [ ] Выполнил SQL для создания администратора:

```sql
-- Создать администратора
INSERT INTO users (id, email, name, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',  -- ЗАМЕНИТЕ НА ВАШ EMAIL
  'Администратор',
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
WHERE email = 'admin@example.com';  -- ЗАМЕНИТЕ НА ВАШ EMAIL
```

- [ ] Выполнил SQL для добавления настроек Telegram:

```sql
-- Токен бота
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'ВАШ_ТОКЕН_БОТА',  -- ЗАМЕНИТЕ
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Telegram ID
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  'ВАШ_TELEGRAM_ID',  -- ЗАМЕНИТЕ
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Вариант B: Seed скрипт

- [ ] Открыл файл `prisma/seed-admin.ts`
- [ ] Заменил `YOUR_TELEGRAM_BOT_TOKEN_HERE` на токен бота
- [ ] Заменил `YOUR_TELEGRAM_USER_ID_HERE` на Telegram ID
- [ ] Выполнил команду: `npm run db:seed:admin`

## 📋 Шаг 4: Переменные окружения

- [ ] Открыл файл `.env`
- [ ] Добавил строку:

```env
JWT_SECRET="ваш_секретный_ключ_минимум_32_символа"
```

**Совет:** Сгенерируйте случайную строку:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📋 Шаг 5: Начать диалог с ботом

- [ ] Нашел своего бота в Telegram (по имени, которое дали при создании)
- [ ] Открыл чат с ботом
- [ ] Отправил команду `/start`
- [ ] Получил ответ от бота (если есть)

## 📋 Шаг 6: Проверка

- [ ] Проверил, что администратор создан:

```sql
SELECT email, role FROM users WHERE email = 'admin@example.com';
-- Должно вернуть: admin@example.com | admin
```

- [ ] Проверил, что настройки добавлены:

```sql
SELECT key, value FROM settings WHERE key LIKE 'ADMIN_TELEGRAM%';
-- Должно вернуть 2 строки
```

- [ ] Проверил, что JWT_SECRET добавлен в `.env`

## 📋 Шаг 7: Запуск и вход

- [ ] Запустил сервер разработки: `npm run dev`
- [ ] Открыл браузер: `http://localhost:3000/admin/signin`
- [ ] Ввел email администратора
- [ ] Ввел Telegram ID
- [ ] Нажал "Получить код"
- [ ] Получил код в Telegram
- [ ] Ввел код на странице верификации
- [ ] Успешно вошел в админ-панель! 🎉

## 🎯 Финальная проверка

После успешного входа проверьте:

- [ ] Отображается dashboard с статистикой
- [ ] Видно имя и email администратора
- [ ] Кнопка "Выйти" работает
- [ ] При попытке зайти на `/profile` перенаправляет в `/admin/dashboard`
- [ ] После выхода перенаправляет на `/admin/signin`

## ❌ Возможные проблемы

### Код не приходит в Telegram

- [ ] Проверил токен бота в таблице `settings`
- [ ] Убедился, что начал диалог с ботом (`/start`)
- [ ] Проверил, что бот активен (не удален)

### "Invalid Telegram ID"

- [ ] Проверил, что ID введен правильно (только цифры, без пробелов)
- [ ] Убедился, что ID в форме совпадает с ID в таблице `settings`

### "User is not an admin"

- [ ] Проверил роль пользователя:
```sql
SELECT email, role FROM users WHERE email = 'admin@example.com';
```
- [ ] Обновил роль, если нужно:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### "User not found"

- [ ] Проверил, что пользователь создан:
```sql
SELECT * FROM users WHERE email = 'admin@example.com';
```
- [ ] Создал пользователя, если его нет (см. Шаг 3)

## 📚 Дополнительная информация

- **Быстрый старт:** [ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md)
- **Полная документация:** [ADMIN_SETUP.md](./ADMIN_SETUP.md)
- **Детали реализации:** [ADMIN_IMPLEMENTATION.md](./ADMIN_IMPLEMENTATION.md)
- **Краткое резюме:** [ADMIN_SUMMARY_RU.md](./ADMIN_SUMMARY_RU.md)

## ✅ Готово!

Если все пункты отмечены, админ-панель настроена и готова к использованию!

**Вход:** `http://localhost:3000/admin/signin`

---

**Важно:** Сохраните этот чеклист для будущих настроек на других серверах.
