# 🔐 Админ-панель ChargeFlow

Профессиональная админ-панель с двухфакторной аутентификацией через Telegram.

## 🚀 Быстрый старт

### 1. Создайте Telegram бота
```
@BotFather → /newbot → Сохраните токен
```

### 2. Получите Telegram ID
```
@userinfobot → Сохраните ID
```

### 3. Настройте базу данных
```bash
# Отредактируйте prisma/seed-admin.ts
npm run db:seed:admin
```

### 4. Добавьте в .env
```env
JWT_SECRET="ваш_секретный_ключ"
```

### 5. Войдите
```
http://localhost:3000/admin/signin
```

## 📚 Документация

- **[ADMIN_CHECKLIST.md](./ADMIN_CHECKLIST.md)** - Пошаговый чеклист настройки ✅
- **[ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md)** - Быстрый старт 🚀
- **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** - Полная документация 📖
- **[ADMIN_IMPLEMENTATION.md](./ADMIN_IMPLEMENTATION.md)** - Детали реализации 🔧
- **[ADMIN_SUMMARY_RU.md](./ADMIN_SUMMARY_RU.md)** - Краткое резюме 📝

## ✨ Возможности

- ✅ Двухфакторная аутентификация через Telegram
- ✅ JWT токены в httpOnly cookies
- ✅ Полное разделение ролей (admin/user)
- ✅ Защита маршрутов через middleware
- ✅ Адаптивный дизайн
- ✅ Локализация (RU/KG)
- ✅ Статистика в реальном времени

## 🎨 Скриншоты

### Страница входа
- Email администратора
- Telegram ID
- Янтарные акценты

### Верификация
- 6-значный код
- Отправка через Telegram
- Повторная отправка

### Dashboard
- Статистика системы
- Быстрые действия
- Информация о пользователе

## 🔒 Безопасность

- **2FA:** Email + Telegram ID + код
- **JWT:** httpOnly cookies, 7 дней
- **Коды:** Одноразовые, 10 минут
- **Middleware:** Автоматическая защита
- **Разделение:** Админы ≠ Пользователи

## 📁 Структура

```
app/
├── admin/
│   ├── signin/          # Вход
│   ├── verify-code/     # Верификация
│   └── dashboard/       # Dashboard
└── api/admin/
    ├── send-code/       # Отправка кода
    ├── verify-code/     # Проверка кода
    ├── me/              # Данные админа
    ├── stats/           # Статистика
    └── logout/          # Выход

lib/
├── telegram.ts          # Telegram API
└── jwt.ts               # JWT токены

proxy.ts                 # Защита маршрутов (Next.js 16)
```

## 🌍 Локализация

- 🇷🇺 Русский
- 🇰🇬 Кыргызча

## 🚀 Дальнейшее развитие

- [ ] Управление пользователями
- [ ] Управление станциями
- [ ] Просмотр бронирований
- [ ] Аналитика и отчеты
- [ ] Финансовые операции
- [ ] Настройки системы
- [ ] Логи активности

## 💡 Советы

1. **Начните с чеклиста:** [ADMIN_CHECKLIST.md](./ADMIN_CHECKLIST.md)
2. **Сохраните токены:** Храните в безопасном месте
3. **Используйте сильный JWT_SECRET:** Минимум 32 символа
4. **Начните диалог с ботом:** Отправьте `/start`

## ❓ Проблемы?

### Код не приходит
- Проверьте токен бота
- Начните диалог с ботом (`/start`)

### Invalid Telegram ID
- Проверьте ID (только цифры)
- Убедитесь, что ID совпадает с БД

### User is not an admin
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## 📞 Поддержка

Подробная документация в файлах:
- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Полная инструкция
- [ADMIN_CHECKLIST.md](./ADMIN_CHECKLIST.md) - Пошаговый чеклист

## ✅ Готово!

Админ-панель готова к использованию. Следуйте чеклисту для настройки.

**Вход:** `http://localhost:3000/admin/signin`

---

Made with ❤️ for ChargeFlow
