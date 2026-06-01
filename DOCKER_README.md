# 🐳 Docker для ChargeFlow

## Быстрый старт

### Локальное тестирование

```bash
# 1. Соберите образ
docker build -t chargeflow .

# 2. Запустите контейнер (с .env файлом)
docker run -p 3000:3000 --env-file .env chargeflow

# Или используйте готовый скрипт
./docker-test.sh
```

### Структура Dockerfile

Dockerfile использует **multi-stage build** для оптимизации:

1. **base** - базовый образ с Node.js 20
2. **deps** - production зависимости
3. **builder** - сборка приложения
4. **runner** - финальный минимальный образ

### Особенности

✅ **Оптимизированный размер** - использует Alpine Linux и standalone режим Next.js  
✅ **Безопасность** - запуск от непривилегированного пользователя  
✅ **Prisma** - автоматическая генерация клиента  
✅ **Production-ready** - готов к деплою на Timeweb  

### Переменные окружения

Переменные передаются через панель Timeweb App Platform, а не через Dockerfile.

Список необходимых переменных см. в [TIMEWEB_DEPLOY_GUIDE.md](./TIMEWEB_DEPLOY_GUIDE.md)

### Порты

- **3000** - HTTP порт приложения (по умолчанию)

### Важно

- ❌ Не включайте `.env` файл в Git
- ✅ Используйте внешнюю PostgreSQL БД
- ✅ Выполните миграции после первого деплоя
- ✅ Настройте все переменные окружения в Timeweb

## Деплой на Timeweb

Подробная инструкция: [TIMEWEB_DEPLOY_GUIDE.md](./TIMEWEB_DEPLOY_GUIDE.md)

### Краткие шаги:

1. Создайте PostgreSQL БД в Timeweb
2. Подключите репозиторий к App Platform
3. Добавьте переменные окружения
4. Запустите деплой
5. Выполните миграции Prisma

## Troubleshooting

### Ошибка "Cannot find module"
- Убедитесь, что все зависимости в `package.json`
- Пересоберите образ: `docker build --no-cache -t chargeflow .`

### Ошибка подключения к БД
- Проверьте DATABASE_URL
- Убедитесь, что БД доступна из контейнера

### Prisma ошибки
- Выполните `npx prisma generate` локально
- Проверьте, что schema.prisma корректна
