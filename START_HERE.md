# 🎯 НАЧНИТЕ ЗДЕСЬ - Админ-панель ChargeFlow

## 👋 Добро пожаловать!

Админ-панель успешно реализована! Следуйте этой инструкции для настройки.

## 📚 Какую документацию читать?

### 🚀 Хочу быстро настроить
→ **[ADMIN_CHECKLIST.md](./ADMIN_CHECKLIST.md)** - Пошаговый чеклист с галочками

### ⚡ Хочу краткую инструкцию
→ **[ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md)** - 6 шагов до входа

### 📖 Хочу полную документацию
→ **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** - Подробное руководство

### 📝 Хочу краткое резюме
→ **[ADMIN_SUMMARY_RU.md](./ADMIN_SUMMARY_RU.md)** - Что сделано и как работает

### 🔧 Хочу технические детали
→ **[ADMIN_IMPLEMENTATION.md](./ADMIN_IMPLEMENTATION.md)** - Архитектура и код

### 📋 Хочу список изменений
→ **[ADMIN_CHANGES.md](./ADMIN_CHANGES.md)** - Все новые файлы

## ⚡ Быстрый старт (5 минут)

### 1️⃣ Создайте Telegram бота
```
1. Откройте @BotFather в Telegram
2. Отправьте /newbot
3. Следуйте инструкциям
4. Сохраните токен
```

### 2️⃣ Получите Telegram ID
```
1. Откройте @userinfobot в Telegram
2. Отправьте любое сообщение
3. Сохраните ID
```

### 3️⃣ Настройте базу данных
```bash
# Вариант A: SQL (рекомендуется)
# Выполните SQL из ADMIN_QUICK_START.md

# Вариант B: Seed скрипт
# 1. Отредактируйте prisma/seed-admin.ts
# 2. Запустите:
npm run db:seed:admin
```

### 4️⃣ Добавьте в .env
```env
JWT_SECRET="ваш_секретный_ключ_минимум_32_символа"
```

### 5️⃣ Начните диалог с ботом
```
Найдите бота в Telegram → /start
```

### 6️⃣ Войдите!
```
http://localhost:3000/admin/signin
```

## ✅ Что дальше?

После успешного входа вы увидите:
- 📊 Dashboard со статистикой
- 👤 Информацию о вашем аккаунте
- 🚪 Кнопку выхода

## 🎨 Что реализовано?

- ✅ Двухфакторная аутентификация через Telegram
- ✅ Защита всех админских маршрутов
- ✅ Разделение админов и пользователей
- ✅ Адаптивный дизайн
- ✅ Локализация (RU/KG)
- ✅ Статистика в реальном времени

## 📁 Важные файлы

### Для настройки
```
ADMIN_CHECKLIST.md          ← Начните отсюда!
ADMIN_QUICK_START.md        ← Или отсюда!
prisma/seed-admin.ts        ← Отредактируйте токены
.env                        ← Добавьте JWT_SECRET
```

### Для разработки
```
app/admin/                  ← Страницы админки
app/api/admin/              ← API endpoints
lib/telegram.ts             ← Telegram Bot API
lib/jwt.ts                  ← JWT токены
proxy.ts                    ← Защита маршрутов (Next.js 16)
```

## 🔒 Безопасность

### Двухфакторная аутентификация
1. Email администратора (из БД)
2. Telegram ID (из БД)
3. 6-значный код (через Telegram)

### Защита маршрутов
- Админы НЕ могут зайти на пользовательские страницы
- Пользователи НЕ могут зайти в админку
- Автоматические перенаправления

## ❓ Проблемы?

### Код не приходит
→ Проверьте токен бота и начните диалог (`/start`)

### Invalid Telegram ID
→ Проверьте, что ID введен правильно (только цифры)

### User is not an admin
→ Проверьте роль в БД: `SELECT role FROM users WHERE email = '...'`

**Подробнее:** [ADMIN_SETUP.md](./ADMIN_SETUP.md) → Troubleshooting

## 📞 Нужна помощь?

1. **Чеклист:** [ADMIN_CHECKLIST.md](./ADMIN_CHECKLIST.md)
2. **FAQ:** [ADMIN_SETUP.md](./ADMIN_SETUP.md) → Troubleshooting
3. **Детали:** [ADMIN_IMPLEMENTATION.md](./ADMIN_IMPLEMENTATION.md)

## 🎉 Готово!

Следуйте чеклисту и через 5 минут вы войдете в админ-панель!

**Начните здесь:** [ADMIN_CHECKLIST.md](./ADMIN_CHECKLIST.md)

---

Made with ❤️ for ChargeFlow
