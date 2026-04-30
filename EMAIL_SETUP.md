# 📧 Настройка реальной отправки Email

## ✅ Что уже сделано:
- Установлен `nodemailer`
- Обновлен `lib/email.ts` для реальной отправки
- Добавлены настройки в `.env`

## 🔧 Что нужно сделать ВАМ:

### Вариант 1: Gmail (рекомендуется для тестирования)

1. **Откройте ваш Gmail аккаунт**

2. **Включите двухфакторную аутентификацию** (если еще не включена):
   - Перейдите: https://myaccount.google.com/security
   - Найдите "2-Step Verification" и включите

3. **Создайте App Password**:
   - Перейдите: https://myaccount.google.com/apppasswords
   - Выберите "Mail" и "Other (Custom name)"
   - Введите название: "ChargeFlow"
   - Нажмите "Generate"
   - **Скопируйте 16-значный пароль** (например: `abcd efgh ijkl mnop`)

4. **Обновите `.env` файл**:
   ```env
   EMAIL_USER="ваш_email@gmail.com"
   EMAIL_PASS="abcdefghijklmnop"  # без пробелов!
   EMAIL_FROM="ChargeFlow <ваш_email@gmail.com>"
   ```

5. **Перезапустите сервер**:
   ```bash
   # Остановите текущий сервер (Ctrl+C)
   npm run dev
   ```

6. **Протестируйте**:
   - Зарегистрируйтесь или войдите
   - Проверьте вашу почту - письмо должно прийти!

---

### Вариант 2: Другой SMTP сервис

Если у вас другой email провайдер, обновите настройки:

#### Mail.ru:
```env
EMAIL_HOST="smtp.mail.ru"
EMAIL_PORT="465"
EMAIL_SECURE="true"
EMAIL_USER="ваш_email@mail.ru"
EMAIL_PASS="ваш_пароль"
```

#### Yandex:
```env
EMAIL_HOST="smtp.yandex.ru"
EMAIL_PORT="465"
EMAIL_SECURE="true"
EMAIL_USER="ваш_email@yandex.ru"
EMAIL_PASS="ваш_пароль"
```

#### Outlook/Hotmail:
```env
EMAIL_HOST="smtp-mail.outlook.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="ваш_email@outlook.com"
EMAIL_PASS="ваш_пароль"
```

---

## 🧪 Проверка работы

После настройки:

1. Запустите `npm run dev`
2. Зарегистрируйтесь с реальным email
3. Проверьте почту - должно прийти письмо "Добро пожаловать в ChargeFlow!"
4. Войдите снова - должно прийти письмо "Вход в аккаунт ChargeFlow"

---

## ❗ Важно:

- **Не коммитьте `.env` файл в Git!** (он уже в `.gitignore`)
- App Password от Gmail безопаснее обычного пароля
- Если письма не приходят, проверьте папку "Спам"
- В консоли будут логи отправки писем

---

## 🐛 Проблемы?

### Письма не приходят:
1. Проверьте правильность EMAIL_USER и EMAIL_PASS
2. Убедитесь, что нет пробелов в App Password
3. Проверьте папку "Спам"
4. Посмотрите логи в терминале

### Ошибка "Invalid login":
- Проверьте, что включена двухфакторная аутентификация
- Создайте новый App Password
- Убедитесь, что используете App Password, а не обычный пароль

### Ошибка "Connection timeout":
- Проверьте интернет соединение
- Попробуйте изменить EMAIL_PORT на "465" и EMAIL_SECURE на "true"
