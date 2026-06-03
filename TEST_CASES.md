# Тестовые сценарии

## Валидация регистрации и авторизации (9 тестов)

**Файл:** `__tests__/auth-main.test.ts`

| № | Название | Исходные данные | Ожидаемый результат |
|---|----------|-----------------|---------------------|
| 1 | Валидный пароль | password = "Test123!@#" | isValid=true, errors=[] |
| 2 | Слабый пароль | password = "weak" | isValid=false, errors>0 |
| 3 | Валидные данные регистрации | email = "test@example.com"<br>password = "Test123!@#" | isValid=true, errors=[] |
| 4 | Невалидный email | email = "invalid-email"<br>password = "Test123!@#" | isValid=false<br>error="Неверный формат email" |
| 5 | Валидные данные входа | email = "test@example.com"<br>password = "anypassword" | isValid=true, errors=[] |
| 6 | Генерация кода верификации | (без параметров) | code длиной 6 цифр<br>100000 ≤ code ≤ 999999 |
| 7 | Валидный код верификации | email = "test@example.com"<br>code = "123456"<br>type = "login"<br>expiresAt = текущее время + 5 мин | valid=true<br>update вызван |
| 8 | Истекший код верификации | email = "test@example.com"<br>code = "123456"<br>type = "login"<br>expiresAt = текущее время - 5 мин | valid=false<br>error="истек" |
| 9 | Хеширование пароля | password = "Test123!@#"<br>salt = 10 | bcrypt.hash вызван<br>result = "hashed_password_mock" |

## Функции валидации

- `validatePassword(password)` - валидация пароля
- `validateRegisterInput(email, password)` - валидация регистрации
- `validateLoginInput(email, password)` - валидация входа
- `generateVerificationCode()` - генерация 6-значного кода
- `verifyCode(email, code, type)` - проверка кода
- `bcrypt.hash(password, 10)` - хеширование пароля

## Запуск

```bash
npm test auth-main
```

## Результат

```
Tests: 9 passed, 9 total
```
