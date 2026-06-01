# 🛠️ Полезные команды

## Docker команды

### Локальная разработка

```bash
# Собрать Docker образ
docker build -t chargeflow .

# Собрать без кэша (если нужна чистая сборка)
docker build --no-cache -t chargeflow .

# Запустить контейнер
docker run -p 3000:3000 --env-file .env chargeflow

# Запустить в фоновом режиме
docker run -d -p 3000:3000 --env-file .env --name chargeflow-app chargeflow

# Посмотреть логи
docker logs chargeflow-app

# Посмотреть логи в реальном времени
docker logs -f chargeflow-app

# Остановить контейнер
docker stop chargeflow-app

# Удалить контейнер
docker rm chargeflow-app

# Удалить образ
docker rmi chargeflow

# Зайти внутрь контейнера
docker exec -it chargeflow-app sh

# Посмотреть размер образа
docker images chargeflow
```

### Быстрое тестирование

```bash
# Использовать готовый скрипт
./docker-test.sh
```

## Prisma команды

### Локальная разработка

```bash
# Сгенерировать Prisma Client
npm run db:generate

# Применить изменения схемы к БД (dev)
npm run db:push

# Создать миграцию
npm run db:migrate

# Открыть Prisma Studio
npm run db:studio

# Загрузить seed данные
npm run db:seed

# Загрузить админа
npm run db:seed:admin
```

### Production (Timeweb)

```bash
# Применить миграции на production
DATABASE_URL="ваш_production_url" npx prisma migrate deploy

# Загрузить seed данные на production
DATABASE_URL="ваш_production_url" npm run db:seed

# Загрузить админа на production
DATABASE_URL="ваш_production_url" npm run db:seed:admin

# Посмотреть статус миграций
DATABASE_URL="ваш_production_url" npx prisma migrate status
```

## Next.js команды

```bash
# Запустить dev сервер
npm run dev

# Запустить dev сервер (доступен извне)
npm run dev:local

# Собрать production версию
npm run build

# Запустить production сервер
npm start

# Проверить код (lint)
npm run lint
```

## Git команды для деплоя

```bash
# Проверить статус
git status

# Добавить все изменения
git add .

# Закоммитить
git commit -m "Описание изменений"

# Запушить (запустит автодеплой на Timeweb)
git push origin main

# Посмотреть последние коммиты
git log --oneline -10

# Откатить последний коммит (если нужно)
git revert HEAD
git push origin main
```

## Генерация секретных ключей

```bash
# Сгенерировать случайный секретный ключ
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Сгенерировать несколько ключей
node -e "for(let i=0; i<3; i++) console.log(require('crypto').randomBytes(32).toString('base64'))"

# Сгенерировать hex ключ
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Проверка переменных окружения

```bash
# Проверить, что .env файл не в Git
git ls-files | grep .env

# Если команда выше ничего не вернула - всё ОК
# Если вернула .env - удалите его из Git:
git rm --cached .env
git commit -m "Remove .env from git"
git push
```

## Отладка

```bash
# Проверить, какие порты заняты
lsof -i :3000

# Убить процесс на порту 3000
kill -9 $(lsof -t -i:3000)

# Проверить подключение к БД
psql "ваш_DATABASE_URL"

# Проверить размер node_modules
du -sh node_modules

# Очистить кэш npm
npm cache clean --force

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install
```

## PWA команды

```bash
# Сгенерировать иконки для PWA
npm run pwa:icons
```

## Полезные алиасы (добавьте в ~/.zshrc или ~/.bashrc)

```bash
# Алиасы для Docker
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias dstop='docker stop $(docker ps -q)'
alias drm='docker rm $(docker ps -aq)'
alias drmi='docker rmi $(docker images -q)'

# Алиасы для проекта
alias dev='npm run dev'
alias build='npm run build'
alias start='npm start'
alias prisma-studio='npm run db:studio'

# После добавления выполните:
source ~/.zshrc  # или source ~/.bashrc
```

## Мониторинг в production

```bash
# Проверить статус приложения (через Timeweb CLI, если установлен)
# Или используйте веб-панель Timeweb

# Посмотреть логи через curl (если есть доступ)
curl https://ваш-домен.timeweb.cloud/api/health

# Проверить время отклика
curl -w "@-" -o /dev/null -s https://ваш-домен.timeweb.cloud <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_pretransfer:  %{time_pretransfer}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

## Бэкап базы данных

```bash
# Создать дамп БД
pg_dump "ваш_DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из дампа
psql "ваш_DATABASE_URL" < backup_20240101_120000.sql

# Создать дамп только схемы
pg_dump --schema-only "ваш_DATABASE_URL" > schema.sql

# Создать дамп только данных
pg_dump --data-only "ваш_DATABASE_URL" > data.sql
```

## Проверка безопасности

```bash
# Проверить зависимости на уязвимости
npm audit

# Исправить уязвимости автоматически
npm audit fix

# Проверить устаревшие пакеты
npm outdated

# Обновить пакеты
npm update
```
