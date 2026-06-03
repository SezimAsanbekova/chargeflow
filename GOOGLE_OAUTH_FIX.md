# 🔧 Исправление Google OAuth - invalid_grant ошибка

## ❌ Проблема
```
[OAUTH_CALLBACK_ERROR] invalid_grant (Bad Request)
```

## ✅ Решение

### Шаг 1: Проверьте Google Cloud Console (КРИТИЧНО!)

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите: **APIs & Services → Credentials**
4. Нажмите на ваш OAuth 2.0 Client ID

5. **В секции "Authorized redirect URIs" должны быть указаны:**
   ```
   https://sezimasanbekova-chargeflow-003a.twc1.net/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

6. **В секции "Authorized JavaScript origins" должны быть:**
   ```
   https://sezimasanbekova-chargeflow-003a.twc1.net
   http://localhost:3000
   ```

7. Нажмите **SAVE** (сохранить)

### Шаг 2: Проверьте переменные окружения на сервере

Выполните на сервере:
```bash
echo $NEXTAUTH_URL
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

Должно быть:
```bash
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Шаг 3: Очистите кэш и перезапустите приложение

```bash
# Остановите приложение
pm2 stop all
# или
docker-compose down

# Очистите кэш Next.js
rm -rf .next

# Пересоберите
npm run build

# Запустите снова
pm2 start npm --name "chargeflow" -- start
# или
docker-compose up -d
```

### Шаг 4: Очистите cookies в браузере

1. Откройте DevTools (F12)
2. Перейдите в Application → Cookies
3. Удалите все cookies для домена `sezimasanbekova-chargeflow-003a.twc1.net`
4. Обновите страницу (F5)
5. Попробуйте войти снова

### Шаг 5: Проверьте настройки OAuth Consent Screen

В Google Cloud Console:
1. Перейдите: **APIs & Services → OAuth consent screen**
2. Убедитесь, что:
   - Publishing status: **In production** (или Testing с добавленными тестовыми пользователями)
   - Authorized domains содержит: `sezimasanbekova-chargeflow-003a.twc1.net`

## 🔍 Что было изменено в коде

В `lib/auth-config.ts` добавлены параметры авторизации:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  allowDangerousEmailAccountLinking: true,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
}),
```

Эти параметры:
- `prompt: "consent"` - заставляет Google всегда показывать экран согласия
- `access_type: "offline"` - позволяет получать refresh токены
- `response_type: "code"` - использует Authorization Code Flow (более безопасный)

## 🧪 Тестирование

После применения исправлений:

1. Откройте incognito/private окно
2. Перейдите на: `https://sezimasanbekova-chargeflow-003a.twc1.net/auth/signin`
3. Нажмите "Войти через Google"
4. Выберите аккаунт
5. Должно перенаправить на `/profile` или `/map`

## 📊 Проверка логов

Если проблема сохраняется, проверьте логи:

```bash
# Для PM2
pm2 logs chargeflow --lines 50

# Для Docker
docker logs chargeflow-app --tail 50
```

Ищите строки:
- `✅ [GOOGLE] Login successful:` - успешный вход
- `❌ [GOOGLE]` - ошибки Google OAuth
- `[OAUTH_CALLBACK_ERROR]` - ошибки callback

## 🆘 Если всё ещё не работает

### Возможная причина: Проблема с SSL/HTTPS

Если используете reverse proxy (nginx, Apache):

1. Убедитесь, что proxy передаёт правильные заголовки:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

2. В NextAuth конфиге уже есть правильные настройки для production cookies

### Альтернативное решение: Создайте новый OAuth Client

Если ничего не помогает:

1. В Google Cloud Console создайте **новый** OAuth 2.0 Client ID
2. Настройте Authorized redirect URIs с самого начала
3. Обновите `.env` файл с новыми CLIENT_ID и CLIENT_SECRET
4. Перезапустите приложение

## ✅ Контрольный список

- [ ] Redirect URI добавлен в Google Cloud Console
- [ ] JavaScript origins добавлен в Google Cloud Console
- [ ] Переменные окружения правильные на сервере
- [ ] Приложение пересобрано и перезапущено
- [ ] Cookies очищены в браузере
- [ ] OAuth Consent Screen настроен правильно
- [ ] Логи проверены на наличие других ошибок
