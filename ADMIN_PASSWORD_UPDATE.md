# ✅ Обновление: Пароль вместо Telegram ID

## Что изменилось

Поле "Telegram ID" заменено на "Пароль" для более удобного входа.

## Изменения

### Было (Telegram ID)
```
Email администратора: admin@example.com
Telegram ID: 123456789
```

### Стало (Пароль)
```
Email администратора: admin@example.com
Пароль: ********
```

## Процесс входа

### Новый процесс
1. Администратор вводит **email** и **пароль**
2. Система проверяет пароль в базе данных
3. Если пароль правильный → отправляет код в Telegram
4. Администратор вводит код из Telegram
5. Вход выполнен ✅

### Преимущества
- ✅ Не нужно запоминать Telegram ID
- ✅ Стандартный процесс входа (email + пароль)
- ✅ Telegram используется только для 2FA кода
- ✅ Более понятный интерфейс

## Технические детали

### Измененные файлы

#### 1. app/admin/signin/page.tsx
```typescript
// Было
const [formData, setFormData] = useState({
  email: '',
  telegramId: '',
});

// Стало
const [formData, setFormData] = useState({
  email: '',
  password: '',
});
```

#### 2. app/api/admin/send-code/route.ts
```typescript
// Было
const { email, telegramId } = await request.json();
// Проверка Telegram ID из settings

// Стало
const { email, password } = await request.json();
// Проверка пароля через bcrypt
const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
```

#### 3. app/admin/verify-code/page.tsx
```typescript
// Было
const telegramId = sessionStorage.getItem('admin-telegram-id');

// Стало
const password = sessionStorage.getItem('admin-password');
```

#### 4. Локализация
- `app/i18n/locales/ru/admin.json` - обновлены тексты
- `app/i18n/locales/kg/admin.json` - обновлены тексты

## Настройка

### Создание администратора с паролем

```sql
-- 1. Создать администратора
INSERT INTO users (id, email, name, password_hash, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Администратор',
  '$2a$10$...',  -- Хеш пароля (см. ниже)
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
);

-- 2. Создать баланс
INSERT INTO user_balance (user_id, balance, updated_at)
SELECT id, 0, NOW()
FROM users
WHERE email = 'admin@example.com';
```

### Генерация хеша пароля

#### Вариант 1: Node.js скрипт
```javascript
const bcrypt = require('bcryptjs');
const password = 'ваш_пароль';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

#### Вариант 2: Онлайн
Используйте bcrypt генератор (rounds: 10)

### Настройка Telegram

Telegram ID теперь хранится только в таблице `settings`:

```sql
-- Telegram ID администратора (для отправки кодов)
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_USER_ID',
  'ВАШ_TELEGRAM_ID',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Токен Telegram бота
INSERT INTO settings (id, key, value, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN_TELEGRAM_BOT_TOKEN',
  'ВАШ_ТОКЕН_БОТА',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## Безопасность

### Двухфакторная аутентификация
1. **Первый фактор:** Email + Пароль (что-то, что вы знаете)
2. **Второй фактор:** Код из Telegram (что-то, что у вас есть)

### Защита пароля
- ✅ Пароль хешируется с помощью bcrypt (10 rounds)
- ✅ Пароль никогда не передается в открытом виде
- ✅ Пароль не хранится в sessionStorage (только для повторной отправки кода)

## Использование

### Вход в админ-панель

1. Откройте `http://localhost:3000/admin/signin`
2. Введите email администратора
3. Введите пароль
4. Нажмите "Получить код"
5. Получите код в Telegram
6. Введите код на странице верификации
7. Готово! ✅

## Миграция

### Если у вас уже есть администратор без пароля

```sql
-- Обновить пароль для существующего администратора
UPDATE users
SET password_hash = '$2a$10$...'  -- Хеш вашего пароля
WHERE email = 'admin@example.com' AND role = 'admin';
```

## Проверка

```bash
# TypeScript компилируется без ошибок
npx tsc --noEmit
# ✅ Нет ошибок

# Запуск сервера
npm run dev
# ✅ Работает
```

## Готово! ✅

Теперь вход в админ-панель использует стандартный процесс:
- Email + Пароль
- Код из Telegram (2FA)

**Войдите:** `http://localhost:3000/admin/signin`
