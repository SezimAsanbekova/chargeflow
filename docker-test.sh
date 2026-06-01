#!/bin/bash

# Скрипт для локального тестирования Docker образа
# Использование: ./docker-test.sh

echo "🐳 Сборка Docker образа..."
docker build -t chargeflow:test .

if [ $? -eq 0 ]; then
    echo "✅ Образ успешно собран!"
    echo ""
    echo "📦 Размер образа:"
    docker images chargeflow:test
    echo ""
    echo "🚀 Для запуска контейнера используйте:"
    echo "docker run -p 3000:3000 --env-file .env chargeflow:test"
    echo ""
    echo "⚠️  Убедитесь, что файл .env содержит все необходимые переменные"
else
    echo "❌ Ошибка при сборке образа"
    exit 1
fi
