# 🔐 Настройка админ-панели ChargeFlow

## Обзор

Админ-панель использует двухфакторную аутентификацию через Telegram для обеспечения максимальной безопасности.

## Архитектура

### Процесс входа

1. **Ввод учетных данных**
   - Email администратора (из таблицы `users`)
   - Telegram ID (из таблицы `settings`)

2. **Отправка кода**
   - Генерируется 6-значный код
   - Сохраняется в таблице `email_verification_codes`
   - Отправляется через Telegram Bot API

3. **Верификация кода**
   - Проверка кода из базы данных
   - Генерация JWT токена
   - Установка cookie `admin-token`

4. **Доступ к админ-панели**
   - Middleware проверяет токен
   - Разрешает доступ только администраторам

## Настройка

### 1. Создание Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните токен бота (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Получение Telegram ID

1. Откройте [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте любое сообщение
3. Бот вернет ваш Telegram ID (например: `123456789`)

### 3. Настройка базы данных

#### Создание администратора

```sql
-- Создаем пользователя с ролью admin
INSERT INTO users (id, email, name, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Администратор',
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
);

-- Создаем баланс для администратора
INSERT INTO user_balance (user_id, balance, updated_at)
SELECT id, 0, NOW()
FROM users
WHERE email = 'admin@example.com';
```

#### Добавление настроек Telegram

Используйте скрипт seed:

```bash
npm run db:seed:admin
```

Или вручную через SQL:

```sql
-- Токен Telegram бота
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'YOUR_TELEGRAM_BOT_TOKEN_HERE',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Telegram ID администратора
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  'YOUR_TELEGRAM_USER_ID_HERE',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### 4. Переменные окружения

Добавьте в `.env`:

```env
# JWT для админской аутентификации
JWT_SECRET="your_jwt_secret_key_change_this_in_production"
```

### 5. Запуск seed скрипта

Добавьте в `package.json`:

```json
{
  "scripts": {
    "db:seed:admin": "tsx prisma/seed-admin.ts"
  }
}
```

Запустите:

```bash
npm run db:seed:admin
```

## Использование

### Вход в админ-панель

1. Перейдите на `/admin/signin`
2. Введите email администратора
3. Введите Telegram ID
4. Получите код в Telegram
5. Введите код на странице `/admin/verify-code`
6. Вы будете перенаправлены в `/admin/dashboard`

### Выход

Нажмите кнопку "Выйти" в правом верхнем углу админ-панели.

## Безопасность

### Защита маршрутов

Middleware автоматически защищает:

- ✅ `/admin/*` - доступ только для администраторов
- ✅ `/profile/*` - доступ только для обычных пользователей
- ✅ `/vehicles/*` - доступ только для обычных пользователей
- ✅ `/booking/*` - доступ только для обычных пользователей
- ✅ `/charging/*` - доступ только для обычных пользователей

### Разделение ролей

- **Администраторы** не могут получить доступ к пользовательским страницам
- **Пользователи** не могут получить доступ к админ-панели
- Каждая роль имеет свой токен и систему аутентификации

### JWT токены

- Токены хранятся в httpOnly cookies
- Срок действия: 7 дней
- Автоматическая проверка при каждом запросе

### Коды верификации

- 6-значные коды
- Срок действия: 10 минут
- Одноразовые (помечаются как использованные)
- Хранятся в базе данных с шифрованием

## API Endpoints

### Админские API

- `POST /api/admin/send-code` - Отправка кода верификации
- `POST /api/admin/verify-code` - Проверка кода и вход
- `GET /api/admin/me` - Получение данных администратора
- `GET /api/admin/stats` - Получение статистики
- `POST /api/admin/logout` - Выход из системы

## Структура файлов

```
app/
├── admin/
│   ├── signin/
│   │   └── page.tsx          # Страница входа
│   ├── verify-code/
│   │   └── page.tsx          # Страница ввода кода
│   └── dashboard/
│       └── page.tsx          # Главная страница админки
├── api/
│   └── admin/
│       ├── send-code/
│       │   └── route.ts      # API отправки кода
│       ├── verify-code/
│       │   └── route.ts      # API проверки кода
│       ├── me/
│       │   └── route.ts      # API данных админа
│       ├── stats/
│       │   └── route.ts      # API статистики
│       └── logout/
│           └── route.ts      # API выхода
└── i18n/
    └── locales/
        ├── ru/
        │   └── admin.json    # Русские переводы
        └── kg/
            └── admin.json    # Киргизские переводы

lib/
├── telegram.ts               # Функции работы с Telegram
└── jwt.ts                    # Функции работы с JWT

proxy.ts                      # Защита маршрутов (Next.js 16)
```

## Локализация

Админ-панель поддерживает два языка:

- 🇷🇺 Русский (`ru`)
- 🇰🇬 Кыргызча (`kg`)

Переводы находятся в:
- `app/i18n/locales/ru/admin.json`
- `app/i18n/locales/kg/admin.json`

## Troubleshooting

### Код не приходит в Telegram

1. Проверьте токен бота в таблице `settings`
2. Убедитесь, что бот активен
3. Проверьте Telegram ID в таблице `settings`
4. Убедитесь, что вы начали диалог с ботом (отправьте `/start`)

### Ошибка "Invalid Telegram ID"

1. Проверьте, что Telegram ID в форме входа совпадает с ID в таблице `settings`
2. Убедитесь, что ID введен без пробелов

### Ошибка "User is not an admin"

1. Проверьте роль пользователя в таблице `users`:
   ```sql
   SELECT email, role FROM users WHERE email = 'admin@example.com';
   ```
2. Обновите роль, если нужно:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
   ```

### Токен истек

JWT токены действительны 7 дней. После истечения нужно войти заново.

## Дальнейшее развитие

Планируемые функции:

- [ ] Управление пользователями
- [ ] Управление станциями
- [ ] Просмотр бронирований
- [ ] Аналитика и отчеты
- [ ] Финансовые операции
- [ ] Настройки системы
- [ ] Логи активности
- [ ] Уведомления администратора

## Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Проверьте настройки в базе данных
3. Убедитесь, что все переменные окружения установлены
4. Проверьте, что Telegram бот работает корректно
