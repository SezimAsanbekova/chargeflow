#!/bin/bash

# Скрипт для запуска Docker контейнера с переменными окружения
# Использование: ./docker-run.sh

echo "🚀 Запуск Docker контейнера..."

# Загружаем переменные из .env и передаем их через -e
docker run -d \
  -p 3000:3000 \
  --name chargeflow-app \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NODE_ENV="$NODE_ENV" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e NEXTAUTH_URL="$NEXTAUTH_URL" \
  -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  -e GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  -e GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  -e EMAIL_HOST="$EMAIL_HOST" \
  -e EMAIL_PORT="$EMAIL_PORT" \
  -e EMAIL_SECURE="$EMAIL_SECURE" \
  -e EMAIL_USER="$EMAIL_USER" \
  -e EMAIL_PASS="$EMAIL_PASS" \
  -e EMAIL_FROM="$EMAIL_FROM" \
  -e NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e NEXT_PUBLIC_OPENAI_API_KEY="$NEXT_PUBLIC_OPENAI_API_KEY" \
  -e FINIK_ENV="$FINIK_ENV" \
  -e FINIK_API_KEY="$FINIK_API_KEY" \
  -e FINIK_ACCOUNT_ID="$FINIK_ACCOUNT_ID" \
  -e FINIK_PRIVATE_KEY="$FINIK_PRIVATE_KEY" \
  chargeflow

if [ $? -eq 0 ]; then
    echo "✅ Контейнер успешно запущен!"
    echo ""
    echo "📊 Статус контейнера:"
    docker ps | grep chargeflow-app
    echo ""
    echo "📝 Для просмотра логов:"
    echo "docker logs -f chargeflow-app"
    echo ""
    echo "🌐 Приложение доступно по адресу:"
    echo "http://localhost:3000"
    echo ""
    echo "🛑 Для остановки:"
    echo "docker stop chargeflow-app"
    echo "docker rm chargeflow-app"
else
    echo "❌ Ошибка при запуске контейнера"
    exit 1
fi
