# Исправление ошибки balance.toFixed

## Проблема
```
TypeError: balance.toFixed is not a function
```

## Причина
Prisma возвращает `Decimal` тип для полей с типом `Decimal` в схеме, а не обычное число JavaScript. Метод `.toFixed()` доступен только для типа `number`.

## Решение

### 1. API Endpoint (`app/api/user/balance/route.ts`)
Преобразуем Decimal в число при возврате:
```typescript
return NextResponse.json({
  balance: userBalance?.balance ? Number(userBalance.balance) : 0,
});
```

### 2. UserMenu (`app/components/UserMenu.tsx`)
Добавлена проверка типа и преобразование:
```typescript
// При получении данных
setBalance(Number(data.balance) || 0);

// При отображении
{typeof balance === 'number' ? balance.toFixed(2) : '0.00'} сом
```

### 3. Profile Page (`app/profile/page.tsx`)
Аналогичные изменения:
```typescript
// При получении
setBalance(Number(data.balance) || 0);

// При отображении
{balance !== null ? `${balance.toFixed(2)} ₽` : 'Загрузка...'}
```

## Почему это работает

1. **Number()** преобразует Prisma Decimal в JavaScript number
2. **typeof check** гарантирует, что мы вызываем `.toFixed()` только на числах
3. **Fallback '0.00'** обрабатывает случаи, когда balance не является числом

## Альтернативные решения

### Вариант 1: Использовать Decimal.js
```typescript
import { Decimal } from '@prisma/client/runtime/library';

// В компоненте
{balance instanceof Decimal ? balance.toFixed(2) : '0.00'}
```

### Вариант 2: Изменить тип в схеме
```prisma
model UserBalance {
  balance Float @default(0) // Вместо Decimal
}
```
⚠️ Не рекомендуется для финансовых данных из-за проблем с точностью Float

### Вариант 3: Сериализация на сервере
```typescript
// В API route
return NextResponse.json({
  balance: userBalance?.balance?.toString() || "0",
});

// В компоненте
{parseFloat(balance).toFixed(2)}
```

## Рекомендация

Используйте **текущее решение** (преобразование в Number):
- ✅ Простое и понятное
- ✅ Работает везде одинаково
- ✅ Достаточная точность для отображения
- ✅ Нет зависимости от Decimal.js на клиенте

## Проверка

После исправления:
1. Очистите кеш: `rm -rf .next`
2. Перезапустите сервер: `npm run dev`
3. Обновите страницу в браузере (Ctrl+Shift+R / Cmd+Shift+R)
4. Проверьте UserMenu - баланс должен отображаться как "0.00 сом"

## Типы данных Prisma

| Prisma Type | PostgreSQL | JavaScript | Примечание |
|-------------|------------|------------|------------|
| Int         | INTEGER    | number     | Целые числа |
| Float       | DOUBLE     | number     | Дробные (неточные) |
| Decimal     | DECIMAL    | Decimal    | Точные дробные |
| String      | TEXT       | string     | Текст |
| Boolean     | BOOLEAN    | boolean    | true/false |

Для финансовых данных всегда используйте `Decimal`, но преобразуйте в `number` для отображения.
