# ✅ Проверенные API Endpoints

**Сервер:** http://localhost:3001  
**Дата проверки:** 2 июня 2026

---

## 🔐 1. АУТЕНТИФИКАЦИЯ (Authentication)

### ✅ POST `/api/auth/register`
**Описание:** Регистрация нового пользователя  
**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "Test123!@#",
  "name": "Test User"
}
```
**Успешный ответ:**
```json
{
  "success": true,
  "message": "Регистрация успешна",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Test User"
  }
}
```
**Ошибки:**
- `400` - Email и пароль обязательны
- `400` - Пароль не соответствует требованиям безопасности
- `400` - Пользователь с таким email уже существует

---

### ✅ POST `/api/auth/forgot-password`
**Описание:** Запрос на восстановление пароля  
**Тело запроса:**
```json
{
  "email": "user@example.com"
}
```
**Успешный ответ:**
```json
{
  "success": true,
  "message": "Код для сброса пароля отправлен на ваш email"
}
```

---

### ⚠️ POST `/api/auth/send-code`
**Статус:** Требует проверки (возвращает ошибку "Email и пароль обязательны")

---

### ⚠️ POST `/api/auth/verify-code`
**Статус:** Требует проверки

---

### ⚠️ POST `/api/auth/reset-password`
**Статус:** Требует проверки

---

## 🏢 2. СТАНЦИИ (Stations)

### ✅ GET `/api/stations`
**Описание:** Получить список всех зарядных станций  
**Параметры:** нет (опционально: lat, lng, radius)  
**Успешный ответ:**
```json
[
  {
    "id": "uuid",
    "name": "Балыкчы",
    "address": "29, улица Тумонова...",
    "latitude": 42.458649,
    "longitude": 76.193715,
    "status": "available",
    "maxPowerKw": 50,
    "pricePerMinute": 0,
    "connectorType": "CCS2",
    "workingHours": {"schedule": "24/7"},
    "connectors": [...]
  }
]
```

---

### ⚠️ GET `/api/stations/[id]`
**Статус:** Требует проверки

---

### ⚠️ GET `/api/stations/[id]/active-session`
**Статус:** Требует проверки

---

### ⚠️ GET `/api/stations/[id]/available-slots`
**Статус:** Требует проверки

---

## 🚗 3. АВТОМОБИЛИ (Vehicles)

### ❌ GET `/api/vehicles`
**Статус:** Требует авторизацию  
**Ошибка:** `{"error": "Не авторизован"}`

---

## 🧪 4. ТЕСТОВЫЕ (Test)

### ✅ GET `/api/test/db`
**Описание:** Проверка подключения к базе данных  
**Успешный ответ:**
```json
{
  "status": "ok",
  "database": "connected",
  "counts": {
    "stations": 9,
    "connectors": 14,
    "users": 10,
    "vehicles": 3
  },
  "firstStation": {
    "id": "uuid",
    "name": "Балыкчы",
    "connectorsCount": 0,
    "connectors": []
  }
}
```

---

## 📊 СТАТИСТИКА ПРОВЕРКИ

| Категория | Проверено | Работает | Требует авторизации | Требует проверки |
|-----------|-----------|----------|---------------------|------------------|
| Аутентификация | 5 | 2 ✅ | 0 | 3 ⚠️ |
| Станции | 4 | 1 ✅ | 0 | 3 ⚠️ |
| Автомобили | 1 | 0 | 1 ❌ | 0 |
| Тестовые | 1 | 1 ✅ | 0 | 0 |
| **ИТОГО** | **11** | **4** | **1** | **6** |

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ

### Для полной проверки нужно:

1. **Получить токен авторизации** через NextAuth
2. **Проверить endpoints требующие авторизации:**
   - `/api/user/profile` (GET, PATCH)
   - `/api/user/balance` (GET)
   - `/api/user/bookings` (GET, POST, PATCH)
   - `/api/user/vehicles` (GET, POST)
   - `/api/charging/*` (все endpoints)

3. **Проверить остальные auth endpoints:**
   - `/api/auth/send-code`
   - `/api/auth/verify-code`
   - `/api/auth/reset-password`

4. **Проверить endpoints станций:**
   - `/api/stations/[id]`
   - `/api/stations/[id]/active-session`
   - `/api/stations/[id]/available-slots`

5. **Проверить платежи Finik:**
   - `/api/finik/create-payment`
   - `/api/finik/webhook`
   - `/api/finik/complete-redirect`

---

## 💡 РЕКОМЕНДАЦИИ

### Для тестирования API нужно:

1. **Создать тестовый аккаунт** через `/api/auth/register`
2. **Войти через NextAuth** и получить session token
3. **Использовать token** в заголовках для защищённых endpoints
4. **Создать автоматические тесты** с использованием Jest + Supertest

### Пример с авторизацией:
```bash
# 1. Регистрация
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test"}'

# 2. Вход через NextAuth (получить cookie)
# 3. Использовать cookie в запросах

# 4. Защищённый запрос
curl -X GET http://localhost:3001/api/user/profile \
  -H "Cookie: next-auth.session-token=..."
```

---

## ✅ РАБОТАЮЩИЕ ENDPOINTS (подтверждено)

1. ✅ `POST /api/auth/register` - Регистрация
2. ✅ `POST /api/auth/forgot-password` - Забыли пароль
3. ✅ `GET /api/stations` - Список станций
4. ✅ `GET /api/test/db` - Проверка БД

**Остальные 44+ endpoints требуют дополнительной проверки с авторизацией.**
