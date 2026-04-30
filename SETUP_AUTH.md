# Настройка аутентификации

## Обзор
Реализована полная система аутентификации с поддержкой:
- ✅ Регистрация и вход по email/паролю
- ✅ Вход через Google OAuth
- ✅ JWT токены в cookies (httpOnly, secure)
- ✅ Защита маршрутов через middleware
- ✅ Автоматическое создание баланса пользователя

## Настройка Google OAuth

### 1. Создайте проект в Google Cloud Console
1. Перейдите на https://console.cloud.google.com/
2. Создайте новый проект или выберите существующий
3. Включите Google+ API

### 2. Настройте OAuth consent screen
1. Перейдите в "APIs & Services" → "OAuth consent screen"
2. Выберите "External" и нажмите "Create"
3. Заполните обязательные поля:
   - App name: ChargeFlow
   - User support email: ваш email
   - Developer contact: ваш email

### 3. Создайте OAuth 2.0 Client ID
1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth client ID"
3. Выберите "Web application"
4. Настройте:
   - Name: ChargeFlow Web Client
   - Authorized JavaScript origins:
     - http://localhost:3000
     - https://yourdomain.com (для продакшена)
   - Authorized redirect URIs:
     - http://localhost:3000/api/auth/callback/google
     - https://yourdomain.com/api/auth/callback/google (для продакшена)

### 4. Скопируйте credentials
После создания скопируйте:
- Client ID
- Client Secret

### 5. Настройте .env файл
```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Заполните переменные:
DATABASE_URL="postgresql://user:password@localhost:5432/chargeflow"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="сгенерируйте_случайную_строку"
GOOGLE_CLIENT_ID="ваш_google_client_id"
GOOGLE_CLIENT_SECRET="ваш_google_client_secret"
```

Для генерации NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Структура файлов

```
app/
├── api/
│   └── auth/
│       ├── [...nextauth]/route.ts    # NextAuth API handler
│       └── register/route.ts         # Регистрация
├── auth/
│   ├── signin/page.tsx              # Страница входа/регистрации
│   └── error/page.tsx               # Страница ошибок
├── profile/page.tsx                 # Профиль пользователя
└── components/
    └── UserMenu.tsx                 # Меню пользователя

lib/
└── auth-config.ts                   # Конфигурация NextAuth

middleware.ts                        # Защита маршрутов

prisma/
└── schema.prisma                    # Обновленная схема с NextAuth моделями
```

## Защищенные маршруты

Middleware автоматически защищает:
- `/profile/*` - профиль пользователя
- `/bookings/*` - бронирования
- `/vehicles/*` - автомобили
- `/charging/*` - зарядные сессии

## API Endpoints

### POST /api/auth/register
Регистрация нового пользователя
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Имя Пользователя"
}
```

### GET /api/user/balance
Получение баланса текущего пользователя (требует авторизации)

## Использование в компонентах

### Client Components
```tsx
'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Загрузка...</div>;
  if (!session) return <button onClick={() => signIn()}>Войти</button>;
  
  return (
    <div>
      <p>Привет, {session.user.name}</p>
      <button onClick={() => signOut()}>Выйти</button>
    </div>
  );
}
```

### Server Components
```tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export default async function ServerComponent() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Не авторизован</div>;
  }
  
  return <div>Привет, {session.user.name}</div>;
}
```

## Запуск

```bash
# Установите зависимости (если еще не установлены)
npm install

# Примените миграции
npm run db:migrate

# Запустите dev сервер
npm run dev
```

Откройте http://localhost:3000 и перейдите на страницу входа.

## Безопасность

✅ Пароли хешируются с помощью bcrypt
✅ JWT токены хранятся в httpOnly cookies
✅ CSRF защита встроена в NextAuth
✅ Secure cookies в production
✅ Проверка статуса пользователя (blocked)
✅ Валидация email и пароля

## Troubleshooting

### Ошибка "Configuration" при входе через Google
- Проверьте GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env
- Убедитесь, что redirect URI правильно настроен в Google Console

### Ошибка "OAuthAccountNotLinked"
- Email уже используется с другим методом входа
- Пользователь должен войти через оригинальный метод

### Ошибка подключения к БД
- Проверьте DATABASE_URL в .env
- Убедитесь, что PostgreSQL запущен
- Примените миграции: `npm run db:migrate`
