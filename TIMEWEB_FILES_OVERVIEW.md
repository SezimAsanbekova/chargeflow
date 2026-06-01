# 📦 Обзор файлов для деплоя на Timeweb

## 📦 Созданные файлы для деплоя на Timeweb

Я создал оптимизированный Dockerfile и всю необходимую документацию для деплоя вашего Next.js приложения на Timeweb App Platform.

### 🐳 Docker файлы

#### `Dockerfile`
Оптимизированный multi-stage Dockerfile для Next.js приложения:
- ✅ Использует Node.js 20 Alpine (минимальный размер)
- ✅ Multi-stage build (deps → builder → runner)
- ✅ Standalone режим Next.js
- ✅ Автоматическая генерация Prisma Client
- ✅ Запуск от непривилегированного пользователя
- ✅ Порт 3000
- ✅ Фиктивный DATABASE_URL для сборки (реальный передается через Timeweb)

#### `.dockerignore`
Исключает ненужные файлы из Docker образа:
- node_modules, .next, .env
- Документацию, Git файлы
- Конфигурационные файлы разработки

#### `docker-test.sh`
Скрипт для локального тестирования Docker образа:
```bash
./docker-test.sh
```

---

### 📚 Документация

#### `TIMEWEB_QUICK_START.md` ⭐ НАЧНИТЕ ЗДЕСЬ
**Быстрый старт за 5 минут**
- Пошаговая инструкция для быстрого деплоя
- Минимальный набор переменных окружения
- Решение частых проблем

#### `TIMEWEB_DEPLOY_GUIDE.md`
**Полное руководство по деплою**
- Подробное описание процесса деплоя
- Настройка базы данных
- Настройка переменных окружения
- Миграции Prisma
- Автоматический деплой
- Troubleshooting

#### `DEPLOYMENT_CHECKLIST.md`
**Чеклист для деплоя**
- Пошаговый чеклист с галочками
- Проверка перед деплоем
- Проверка после деплоя
- Настройка мониторинга

#### `DOCKER_README.md`
**Docker документация**
- Структура Dockerfile
- Локальное тестирование
- Особенности и оптимизации
- Troubleshooting

#### `COMMANDS.md`
**Справочник команд**
- Docker команды
- Prisma команды
- Git команды
- Генерация секретных ключей
- Отладка и мониторинг
- Бэкап базы данных

---

## 🚀 Как начать?

### Вариант 1: Быстрый старт (5 минут)
```bash
# 1. Прочитайте быстрый старт
cat TIMEWEB_QUICK_START.md

# 2. Следуйте инструкциям
```

### Вариант 2: Подробное изучение (30 минут)
```bash
# 1. Прочитайте полное руководство
cat TIMEWEB_DEPLOY_GUIDE.md

# 2. Используйте чеклист
cat DEPLOYMENT_CHECKLIST.md

# 3. Изучите команды
cat COMMANDS.md
```

### Вариант 3: Локальное тестирование
```bash
# 1. Протестируйте Docker локально
./docker-test.sh

# 2. Запустите контейнер
docker run -p 3000:3000 --env-file .env chargeflow:test

# 3. Откройте http://localhost:3000
```

---

## 📋 Порядок действий для деплоя

### Шаг 1: Подготовка (5 мин)
1. ✅ Создайте PostgreSQL БД в Timeweb
2. ✅ Сгенерируйте секретные ключи
3. ✅ Запушьте код в Git

### Шаг 2: Настройка (10 мин)
1. ✅ Создайте приложение в App Platform
2. ✅ Подключите репозиторий
3. ✅ Добавьте переменные окружения

### Шаг 3: Деплой (5-10 мин)
1. ✅ Запустите деплой
2. ✅ Дождитесь завершения сборки
3. ✅ Проверьте логи

### Шаг 4: Миграции (2 мин)
1. ✅ Выполните `npx prisma migrate deploy`
2. ✅ Загрузите seed данные (опционально)

### Шаг 5: Проверка (3 мин)
1. ✅ Откройте приложение
2. ✅ Проверьте основные функции
3. ✅ Проверьте логи

---

## 🔑 Минимальные переменные окружения

```env
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
NODE_ENV=production
NEXTAUTH_URL=https://ваш-домен.timeweb.cloud
NEXTAUTH_SECRET=сгенерированный_ключ_1
JWT_SECRET=сгенерированный_ключ_2
NEXT_PUBLIC_APP_URL=https://ваш-домен.timeweb.cloud
```

**Генерация ключей:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📊 Структура проекта для Timeweb

```
chargeflow/
├── Dockerfile                    # Docker конфигурация
├── .dockerignore                 # Исключения для Docker
├── docker-test.sh                # Скрипт тестирования
├── next.config.ts                # Next.js конфиг (standalone mode)
├── package.json                  # Зависимости
├── prisma/                       # Prisma схема и миграции
│   ├── schema.prisma
│   └── migrations/
├── app/                          # Next.js приложение
└── docs/
    ├── TIMEWEB_QUICK_START.md    # ⭐ Быстрый старт
    ├── TIMEWEB_DEPLOY_GUIDE.md   # Полное руководство
    ├── DEPLOYMENT_CHECKLIST.md   # Чеклист
    ├── DOCKER_README.md          # Docker документация
    └── COMMANDS.md               # Справочник команд
```

---

## ⚠️ Важные замечания

### ✅ Что НУЖНО делать:
- Использовать внешнюю PostgreSQL БД
- Добавить все переменные окружения в Timeweb
- Выполнить миграции после первого деплоя
- Проверить, что .env НЕ в Git

### ❌ Что НЕ нужно делать:
- Не включайте .env в Git
- Не используйте SQLite в production
- Не храните файлы внутри контейнера
- Не передавайте переменные через Dockerfile

---

## 🆘 Получить помощь

### Документация
1. [TIMEWEB_QUICK_START.md](./TIMEWEB_QUICK_START.md) - Быстрый старт
2. [TIMEWEB_DEPLOY_GUIDE.md](./TIMEWEB_DEPLOY_GUIDE.md) - Полное руководство
3. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Чеклист

### Команды
- [COMMANDS.md](./COMMANDS.md) - Все полезные команды

### Поддержка
- Документация Timeweb: https://timeweb.cloud/docs/app-platform
- Поддержка Timeweb: через панель управления

---

## 🎉 Успешного деплоя!

После настройки ваше приложение будет автоматически деплоиться при каждом `git push`!

```bash
git add .
git commit -m "New feature"
git push origin main
# 🚀 Автодеплой запущен!
```
