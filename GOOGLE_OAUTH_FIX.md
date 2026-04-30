# Исправление Google OAuth

## Проблема
После нажатия "Продолжить" в Google OAuth, пользователь оставался на странице входа и не перенаправлялся на главную страницу.

## Причина
При использовании JWT strategy с PrismaAdapter, NextAuth не создавал пользователя автоматически. Адаптер работает только с database strategy, но мы используем JWT для производительности.

## Решение

### 1. Добавлен signIn callback
Callback вручную создает пользователя при первом входе через Google:

```typescript
async signIn({ user, account, profile }: any) {
  if (account?.provider === 'google') {
    try {
      // Проверяем, существует ли пользователь
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Создаем нового пользователя
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            role: 'user',
            status: 'active',
            passwordHash: null,
          },
        });

        // Создаем баланс
        await prisma.userBalance.create({
          data: {
            userId: newUser.id,
            balance: 0,
          },
        });

        user.id = newUser.id;
      } else {
        user.id = existingUser.id;
      }

      return true;
    } catch (error) {
      console.error('Error in signIn callback:', error);
      return false;
    }
  }
  return true;
}
```

### 2. Обновлен JWT callback
Добавлена логика для получения ID пользователя при первом входе:

```typescript
async jwt({ token, user, account, trigger }: any) {
  if (user) {
    token.id = user.id;
    token.role = user.role || 'user';
  }

  // Если это первый вход через Google, получаем ID пользователя
  if (trigger === 'signIn' && account?.provider === 'google') {
    const dbUser = await prisma.user.findUnique({
      where: { email: token.email as string },
    });
    if (dbUser) {
      token.id = dbUser.id;
      token.role = dbUser.role;
    }
  }

  return token;
}
```

### 3. Добавлен allowDangerousEmailAccountLinking
Позволяет связывать Google аккаунт с существующим email:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  allowDangerousEmailAccountLinking: true,
})
```

### 4. Включен debug режим
Для разработки добавлен debug:

```typescript
debug: process.env.NODE_ENV === 'development',
```

## Как это работает

### Первый вход через Google:
1. Пользователь нажимает "Войти через Google"
2. Перенаправляется на Google для авторизации
3. Google возвращает на `/api/auth/callback/google`
4. **signIn callback** проверяет, существует ли пользователь
5. Если нет - создает нового пользователя и баланс
6. **jwt callback** добавляет ID пользователя в токен
7. **session callback** добавляет данные в сессию
8. Пользователь перенаправляется на главную страницу

### Повторный вход:
1. Пользователь нажимает "Войти через Google"
2. Google возвращает на callback
3. **signIn callback** находит существующего пользователя
4. Использует существующий ID
5. Перенаправление на главную

## Тестирование

### 1. Очистите cookies браузера
```
Chrome: DevTools → Application → Cookies → Clear All
Firefox: DevTools → Storage → Cookies → Delete All
```

### 2. Откройте приложение
```
http://localhost:3000
```

### 3. Нажмите "Войти"

### 4. Выберите "Войти через Google"

### 5. Выберите Google аккаунт

### 6. Нажмите "Продолжить"

### 7. Проверьте результат
- ✅ Вы должны быть перенаправлены на главную страницу
- ✅ В правом верхнем углу должен появиться UserMenu
- ✅ Должны отображаться ваше имя и аватар из Google
- ✅ Баланс должен быть 0.00 сом

### 8. Проверьте БД
```bash
npm run db:studio
```

Откройте таблицы:
- **users** - должен быть новый пользователь с вашим email
- **accounts** - должна быть запись с provider='google'
- **user_balance** - должен быть баланс 0

## Возможные проблемы

### Ошибка "OAuthAccountNotLinked"
**Причина:** Email уже используется с другим методом входа

**Решение:** 
- Войдите через оригинальный метод (email/пароль)
- Или удалите пользователя из БД и попробуйте снова

### Ошибка "Configuration"
**Причина:** Неверные Google credentials

**Решение:**
- Проверьте GOOGLE_CLIENT_ID в .env
- Проверьте GOOGLE_CLIENT_SECRET в .env
- Убедитесь, что redirect URI настроен в Google Console

### Остается на странице входа
**Причина:** Ошибка при создании пользователя

**Решение:**
1. Откройте DevTools → Console
2. Проверьте ошибки
3. Проверьте логи сервера:
```bash
tail -f .next/dev/logs/next-development.log
```

### Ошибка "User not found"
**Причина:** JWT не содержит ID пользователя

**Решение:**
1. Очистите cookies
2. Перезапустите сервер
3. Попробуйте снова

## Альтернативное решение

Если проблемы продолжаются, можно использовать database strategy:

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'database', // Вместо 'jwt'
    maxAge: 7 * 24 * 60 * 60,
  },
  // ... остальная конфигурация
};
```

**Плюсы:**
- ✅ Автоматическое создание пользователей
- ✅ Меньше кода в callbacks
- ✅ Более надежно

**Минусы:**
- ❌ Медленнее (запрос к БД на каждый request)
- ❌ Больше нагрузка на БД
- ❌ Нужна таблица sessions

## Рекомендация

Используйте **текущее решение** (JWT + signIn callback):
- ✅ Быстрее
- ✅ Меньше нагрузка на БД
- ✅ Работает с JWT strategy
- ✅ Полный контроль над процессом

## Проверка работы

После исправления попробуйте:

1. **Новый пользователь через Google:**
   - Используйте email, которого нет в БД
   - Должен создаться новый пользователь
   - Должен быть перенаправлен на главную

2. **Существующий пользователь через Google:**
   - Используйте email, который уже есть в БД
   - Должен войти с существующим аккаунтом
   - Должен быть перенаправлен на главную

3. **Переключение между методами:**
   - Зарегистрируйтесь через email/пароль
   - Выйдите
   - Войдите через Google с тем же email
   - Должно работать (благодаря allowDangerousEmailAccountLinking)

Готово! 🎉
