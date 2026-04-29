# Prisma Database Schema

Схема базы данных для системы зарядных станций электромобилей.

## 📋 Структура базы данных

### Основные модели:

1. **Users** - Пользователи системы
2. **SmsVerificationCode** - Коды подтверждения SMS
3. **Vehicle** - Транспортные средства пользователей
4. **Station** - Зарядные станции
5. **Connector** - Разъёмы на станциях
6. **StationPhoto** - Фотографии станций
7. **Booking** - Бронирования
8. **ChargingSession** - Сессии зарядки
9. **Payment** - Платежи
10. **UserBalance** - Баланс пользователей
11. **ChargingEvent** - События зарядки
12. **Invoice** - Счета
13. **StationAnalytics** - Аналитика по станциям
14. **Setting** - Настройки системы

## 🚀 Начало работы

### 1. Настройка окружения

Скопируйте `.env.example` в `.env` и настройте подключение к базе данных:

\`\`\`bash
cp .env.example .env
\`\`\`

### 2. Генерация Prisma Client

\`\`\`bash
npx prisma generate
\`\`\`

### 3. Создание миграций

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

### 4. Применение миграций в продакшене

\`\`\`bash
npx prisma migrate deploy
\`\`\`

## 📊 Полезные команды

### Просмотр базы данных в Prisma Studio

\`\`\`bash
npx prisma studio
\`\`\`

### Синхронизация схемы с базой (без миграций)

\`\`\`bash
npx prisma db push
\`\`\`

### Получение схемы из существующей базы

\`\`\`bash
npx prisma db pull
\`\`\`

### Форматирование schema.prisma

\`\`\`bash
npx prisma format
\`\`\`

### Валидация схемы

\`\`\`bash
npx prisma validate
\`\`\`

## 🔗 Связи между таблицами

### User (1:N)
- vehicles
- bookings
- chargingSessions
- payments
- invoices

### User (1:1)
- balance

### Station (1:N)
- connectors
- photos
- analytics

### Connector (1:N)
- bookings
- chargingSessions

### Booking (1:N)
- chargingSessions
- payments

### ChargingSession (1:N)
- payments
- chargingEvents
- invoices

## 📝 Примеры использования

### Создание пользователя

\`\`\`typescript
import { prisma } from '@/lib/prisma'

const user = await prisma.user.create({
  data: {
    phone: '+79991234567',
    passwordHash: 'hashed_password',
    role: 'user',
    status: 'active',
    isPhoneVerified: false,
  },
})
\`\`\`

### Получение станций с коннекторами

\`\`\`typescript
const stations = await prisma.station.findMany({
  include: {
    connectors: true,
    photos: true,
  },
  where: {
    status: 'active',
  },
})
\`\`\`

### Создание сессии зарядки

\`\`\`typescript
const session = await prisma.chargingSession.create({
  data: {
    userId: user.id,
    vehicleId: vehicle.id,
    connectorId: connector.id,
    startTime: new Date(),
    status: 'active',
    startedVia: 'app',
  },
})
\`\`\`

### Получение истории зарядок пользователя

\`\`\`typescript
const sessions = await prisma.chargingSession.findMany({
  where: {
    userId: user.id,
    status: 'completed',
  },
  include: {
    vehicle: true,
    connector: {
      include: {
        station: true,
      },
    },
    invoices: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
})
\`\`\`

## 🔐 Типы данных

### Enums

- **UserRole**: user, admin
- **UserStatus**: active, blocked
- **ConnectorType**: CCS2, CHAdeMO, Type2, GB/T
- **ConnectorStatus**: available, busy, broken
- **StationStatus**: active, inactive, maintenance
- **BookingStatus**: active, cancelled, expired, completed
- **DepositStatus**: held, returned, lost
- **ChargingSessionStatus**: created, active, completed, cancelled, error
- **StartMethod**: qr, app
- **PaymentType**: charge, deposit, refund, topup
- **PaymentStatus**: pending, success, failed
- **ChargingEventType**: start, stop, pause, resume, error

## 🛡️ Безопасность

- Все ID используют UUID для безопасности
- Пароли хранятся в виде хешей
- Каскадное удаление настроено для связанных данных
- Индексы на уникальные поля (phone, key)

## 📈 Оптимизация

Рекомендуемые индексы для производительности:

\`\`\`sql
-- Индексы для частых запросов
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_sessions_user_status ON charging_sessions(user_id, status);
CREATE INDEX idx_connectors_station_status ON connectors(station_id, status);
CREATE INDEX idx_analytics_station_date ON station_analytics(station_id, date);
\`\`\`

## 🔄 Миграции

Все миграции хранятся в `prisma/migrations/`. При изменении схемы создавайте новую миграцию:

\`\`\`bash
npx prisma migrate dev --name описание_изменений
\`\`\`
