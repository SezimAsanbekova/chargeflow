# Исправления в логике зарядки

## Проблема

В схеме Prisma модель `Station` не содержит полей `pricePerMinute` и `maxPowerKw`. Эти данные находятся в модели `Connector`:

```prisma
model Station {
  id           String        @id @default(uuid()) @db.Uuid
  name         String        @db.VarChar(100)
  address      String        @db.Text
  latitude     Decimal       @db.Decimal(10, 7)
  longitude    Decimal       @db.Decimal(10, 7)
  status       StationStatus @default(active)
  // НЕТ pricePerMinute и maxPowerKw!
}

model Connector {
  id          String          @id @default(uuid()) @db.Uuid
  stationId   String          @map("station_id") @db.Uuid
  type        ConnectorType
  powerKw     Decimal         @map("power_kw") @db.Decimal(5, 2)
  pricePerKwh Decimal         @map("price_per_kwh") @db.Decimal(6, 2)
  // ТУТ находятся нужные поля!
}
```

## Решение

Все API endpoints обновлены для использования данных из `Connector`:

### 1. `/api/stations/[id]/route.ts`

**Было**: Попытка получить `station.pricePerMinute` и `station.maxPowerKw`

**Стало**: 
- Находим коннектор с максимальной мощностью
- Используем `connector.pricePerKwh` как `pricePerMinute`
- Используем `connector.powerKw` как `maxPowerKw`

```typescript
const maxPowerConnector = station.connectors.reduce((max, connector) => 
  Number(connector.powerKw) > Number(max.powerKw) ? connector : max
, station.connectors[0]);

return {
  pricePerMinute: Number(maxPowerConnector.pricePerKwh),
  maxPowerKw: Number(maxPowerConnector.powerKw),
  // ...
}
```

### 2. `/api/charging/start/route.ts`

**Изменения**:
- `connector.station.pricePerMinute` → `connector.pricePerKwh`
- `connector.station.maxPowerKw` → `connector.powerKw`
- Убраны несуществующие поля из `select` в запросе

### 3. `/api/charging/active/route.ts`

**Изменения**:
- `activeSession.connector.station.pricePerMinute` → `activeSession.connector.pricePerKwh`
- `activeSession.connector.station.maxPowerKw` → `activeSession.connector.powerKw`

### 4. `/api/charging/tick/route.ts`

**Изменения**:
- `activeSession.connector.station.pricePerMinute` → `activeSession.connector.pricePerKwh`
- `activeSession.connector.station.maxPowerKw` → `activeSession.connector.powerKw`

### 5. `/api/charging/stop/route.ts`

**Изменения**:
- `result.session.connector.station.pricePerMinute` → `result.session.connector.pricePerKwh`

### 6. `/api/charging/session/[id]/route.ts`

**Изменения**:
- `chargingSession.connector.station.pricePerMinute` → `chargingSession.connector.pricePerKwh`

### 7. `/api/charging/invoice/[id]/route.ts`

**Изменения**:
- `invoice.session.connector.station.pricePerMinute` → `invoice.session.connector.pricePerKwh`

## Важные замечания

### Семантика `pricePerKwh` vs `pricePerMinute`

В текущей реализации поле `pricePerKwh` используется как **цена за минуту**, а не за киловатт-час. Это может быть:

1. **Временное решение** - пока не добавлено отдельное поле `pricePerMinute` в схему
2. **Намеренное решение** - если бизнес-логика предполагает тарификацию по времени, а не по энергии

### Рекомендации для продакшена

Если нужна тарификация **по времени** (как сейчас):

```prisma
model Connector {
  // ... существующие поля
  pricePerMinute Decimal @map("price_per_minute") @db.Decimal(6, 2)
}
```

Если нужна тарификация **по энергии**:

```typescript
// В /api/charging/tick/route.ts
const energyUsed = energyIncrement; // кВт⋅ч за минуту
const cost = energyUsed * pricePerKwh; // вместо фиксированной цены за минуту
```

### Миграция данных

Если добавляете новое поле `pricePerMinute`:

```bash
# 1. Добавить поле в schema.prisma
# 2. Создать миграцию
npm run db:migrate

# 3. Заполнить данные (если нужно скопировать из pricePerKwh)
# SQL:
UPDATE connectors SET price_per_minute = price_per_kwh;
```

## Проверка работоспособности

После исправлений проверьте:

1. ✅ API `/api/stations/[id]` возвращает корректные данные
2. ✅ Зарядка начинается без ошибок
3. ✅ Поминутное списание работает
4. ✅ Все суммы рассчитываются правильно
5. ✅ Чеки генерируются с корректными данными

## Тестирование

```bash
# Проверить получение станции
curl http://localhost:3000/api/stations/STATION_ID

# Должен вернуть:
{
  "id": "...",
  "pricePerMinute": 14,  // из connector.pricePerKwh
  "maxPowerKw": 50,      // из connector.powerKw
  "connectors": [...]
}
```
