# 🚀 Быстрый старт деплоя на Timeweb

## За 5 минут до деплоя

### 1️⃣ Создайте БД в Timeweb
```
Timeweb Cloud → Базы данных → Создать → PostgreSQL
```
Сохраните строку подключения (DATABASE_URL)

### 2️⃣ Сгенерируйте секретные ключи
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Выполните дважды для NEXTAUTH_SECRET и JWT_SECRET

### 3️⃣ Запушьте код в Git
```bash
git add .
git commit -m "Ready for Timeweb deploy"
git push origin main
```

### 4️⃣ Создайте приложение в Timeweb
```
App Platform → Создать приложение → Подключить репозиторий
```

### 5️⃣ Добавьте переменные окружения

**Минимальный набор:**
```env
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
NODE_ENV=production
NEXTAUTH_URL=https://ваш-домен.timeweb.cloud
NEXTAUTH_SECRET=ваш_сгенерированный_ключ_1
JWT_SECRET=ваш_сгенерированный_ключ_2
NEXT_PUBLIC_APP_URL=https://ваш-домен.timeweb.cloud
```

**Если используете Google OAuth:**
```env
GOOGLE_CLIENT_ID=ваш_client_id
GOOGLE_CLIENT_SECRET=ваш_client_secret
```

**Если используете Email:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=ваш_email@gmail.com
EMAIL_PASS=ваш_app_password
EMAIL_FROM=ChargeFlow <ваш_email@gmail.com>
```

### 6️⃣ Запустите деплой
```
Нажмите "Создать приложение" → Дождитесь завершения сборки
```

### 7️⃣ Выполните миграции
```bash
DATABASE_URL="ваш_production_url" npx prisma migrate deploy
```

### 8️⃣ (Опционально) Загрузите начальные данные
```bash
DATABASE_URL="ваш_production_url" npm run db:seed
DATABASE_URL="ваш_production_url" npm run db:seed:admin
```

## ✅ Готово!

Ваше приложение доступно по адресу: `https://ваш-домен.timeweb.cloud`

---

## 📚 Подробная документация

- [TIMEWEB_DEPLOY_GUIDE.md](./TIMEWEB_DEPLOY_GUIDE.md) - Полное руководство
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Чеклист деплоя
- [DOCKER_README.md](./DOCKER_README.md) - Docker документация
- [COMMANDS.md](./COMMANDS.md) - Полезные команды

---

## 🆘 Частые проблемы

### Ошибка сборки
✅ Проверьте логи в панели Timeweb  
✅ Убедитесь, что Dockerfile в корне проекта

### Ошибка подключения к БД
✅ Проверьте правильность DATABASE_URL  
✅ Убедитесь, что БД доступна

### Приложение не запускается
✅ Проверьте, что все переменные окружения добавлены  
✅ Проверьте логи контейнера

### Prisma ошибки
✅ Выполните миграции: `npx prisma migrate deploy`  
✅ Проверьте DATABASE_URL

---

## 🔄 Автоматические обновления

После настройки каждый `git push` автоматически деплоит новую версию!

```bash
git add .
git commit -m "Update feature"
git push origin main
# 🎉 Автодеплой запущен!
```

---

## 💡 Совет

Создайте отдельные приложения для:
- **Staging** (ветка `develop`)
- **Production** (ветка `main`)

Это позволит тестировать изменения перед релизом!
