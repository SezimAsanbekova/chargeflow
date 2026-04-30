# Email уведомления о входе

## ✅ Реализовано

Система отправки email уведомлений при входе и регистрации в ChargeFlow.

## Когда отправляются уведомления

### 1. При регистрации
**Письмо:** "Добро пожаловать в ChargeFlow!"

Содержит:
- Приветствие
- Список возможностей сервиса
- Кнопку "Перейти в профиль"

### 2. При входе (email + пароль)
**Письмо:** "Вход в аккаунт ChargeFlow"

Содержит:
- Уведомление о входе
- Детали: email, время, сервис
- Инструкции если это были не вы
- Кнопку "Перейти в профиль"

### 3. При входе через Google
**Письмо:** "Вход в аккаунт ChargeFlow"

Отправляется только если пользователь уже существует (не первый вход).

## Структура

### Файлы:

```
lib/
└── email.ts                    # Утилиты для отправки email

lib/auth-config.ts              # Обновлен: отправка при входе
app/api/auth/register/route.ts  # Обновлен: отправка при регистрации
```

### Функции в `lib/email.ts`:

#### `sendEmail(options)`
Отправляет email. В development логирует в консоль.

```typescript
await sendEmail({
  to: 'user@example.com',
  subject: 'Тема письма',
  html: '<html>...</html>',
});
```

#### `getLoginNotificationEmail(name, email)`
Генерирует HTML для уведомления о входе.

```typescript
const emailContent = getLoginNotificationEmail('Иван', 'ivan@example.com');
// Возвращает: { subject: '...', html: '...' }
```

#### `getRegistrationEmail(name, email)`
Генерирует HTML для приветственного письма.

```typescript
const emailContent = getRegistrationEmail('Иван', 'ivan@example.com');
// Возвращает: { subject: '...', html: '...' }
```

## Как работает

### Development режим:
```
Вход/Регистрация
       ↓
Отправка email
       ↓
Логирование в консоль (не отправляется реально)
       ↓
Продолжение работы
```

В терминале вы увидите:
```
📧 Email отправлен:
To: user@example.com
Subject: Вход в аккаунт ChargeFlow
HTML: <!DOCTYPE html>...
```

### Production режим:
```
Вход/Регистрация
       ↓
Отправка email через сервис (Resend, SendGrid, etc.)
       ↓
Email доставляется пользователю
       ↓
Продолжение работы
```

## Настройка для Production

### Вариант 1: Resend (рекомендуется)

1. **Зарегистрируйтесь на** https://resend.com
2. **Получите API ключ**
3. **Установите пакет:**
```bash
npm install resend
```

4. **Обновите `lib/email.ts`:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email отправлен:', { to, subject });
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: 'ChargeFlow <noreply@chargeflow.kg>',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
```

5. **Добавьте в `.env`:**
```
RESEND_API_KEY="re_..."
```

### Вариант 2: SendGrid

1. **Зарегистрируйтесь на** https://sendgrid.com
2. **Получите API ключ**
3. **Установите пакет:**
```bash
npm install @sendgrid/mail
```

4. **Обновите `lib/email.ts`:**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email отправлен:', { to, subject });
    return { success: true };
  }

  try {
    await sgMail.send({
      from: 'noreply@chargeflow.kg',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
```

5. **Добавьте в `.env`:**
```
SENDGRID_API_KEY="SG...."
```

### Вариант 3: Nodemailer (SMTP)

1. **Установите пакет:**
```bash
npm install nodemailer
```

2. **Обновите `lib/email.ts`:**
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email отправлен:', { to, subject });
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: '"ChargeFlow" <noreply@chargeflow.kg>',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
```

3. **Добавьте в `.env`:**
```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Тестирование

### 1. Регистрация нового пользователя
```
1. Откройте http://localhost:3000/auth/signin
2. Переключитесь на "Регистрация"
3. Введите данные
4. Нажмите "Зарегистрироваться"
5. Проверьте терминал - должно быть:
   📧 Email отправлен:
   To: your@email.com
   Subject: Добро пожаловать в ChargeFlow!
```

### 2. Вход существующего пользователя
```
1. Откройте http://localhost:3000/auth/signin
2. Введите email и пароль
3. Нажмите "Войти"
4. Проверьте терминал - должно быть:
   📧 Email отправлен:
   To: your@email.com
   Subject: Вход в аккаунт ChargeFlow
```

### 3. Вход через Google
```
1. Откройте http://localhost:3000/auth/signin
2. Нажмите "Войти через Google"
3. Выберите аккаунт (уже зарегистрированный)
4. Проверьте терминал - должно быть уведомление
```

## Содержимое писем

### Приветственное письмо:
```
Тема: Добро пожаловать в ChargeFlow!

Здравствуйте, [Имя]!

Спасибо за регистрацию в ChargeFlow - вашем надежном 
помощнике для зарядки электромобилей.

Что вы можете делать:
• 🗺️ Находить ближайшие зарядные станции
• 📅 Бронировать станции заранее
• ⚡ Отслеживать процесс зарядки
• 💳 Удобная оплата
• 📊 История всех зарядок

[Кнопка: Перейти в профиль]
```

### Уведомление о входе:
```
Тема: Вход в аккаунт ChargeFlow

Здравствуйте, [Имя]!

Мы заметили вход в ваш аккаунт ChargeFlow.

Детали входа:
📧 Email: user@example.com
🕐 Время: 30 апреля 2026 г., 15:30
🌐 Сервис: ChargeFlow

Если это были вы, можете проигнорировать это письмо.

Если это были не вы, немедленно:
• Смените пароль
• Свяжитесь с нашей службой поддержки

[Кнопка: Перейти в профиль]
```

## Безопасность

### Что НЕ отправляется:
- ❌ Пароли
- ❌ Токены
- ❌ Коды верификации (это просто уведомление)
- ❌ Личные данные

### Что отправляется:
- ✅ Email пользователя
- ✅ Имя пользователя
- ✅ Время входа
- ✅ Название сервиса

## Отключение уведомлений

Если нужно временно отключить отправку email:

### В `lib/email.ts`:
```typescript
export async function sendEmail({ to, subject, html }: EmailOptions) {
  // Всегда только логировать
  console.log('📧 Email отправлен:', { to, subject });
  return { success: true };
}
```

Или добавьте переменную окружения:
```typescript
export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (process.env.DISABLE_EMAILS === 'true') {
    console.log('📧 Email отключен:', { to, subject });
    return { success: true };
  }
  // ... остальной код
}
```

## ✨ Готово!

Теперь при входе и регистрации:
- ✅ Отправляются email уведомления
- ✅ В development логируются в консоль
- ✅ В production отправляются реально (после настройки)
- ✅ Красивый HTML дизайн
- ✅ Безопасно и информативно

Попробуйте зарегистрироваться и проверьте терминал! 📧
