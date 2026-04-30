# 🎨 Обновление логотипа ChargeFlow

## ✅ Что было сделано

Заменили эмодзи ⚡ на реальный логотип `logo12.png` во всех местах:

### 1. Страницы аутентификации
- ✅ `/auth/signin` - страница входа/регистрации
- ✅ `/auth/verify-code` - страница ввода кода 2FA

### 2. Email шаблоны
- ✅ Письмо с кодом верификации
- ✅ Письмо о входе в аккаунт
- ✅ Приветственное письмо при регистрации

### 3. Главная страница
- ✅ Уже использовала `logo12.png` (не требовалось изменений)

---

## 📍 Где используется логотип

### В веб-интерфейсе:

```tsx
<Image 
  src="/logo12.png" 
  alt="ChargeFlow" 
  width={40} 
  height={40}
  className="object-contain"
/>
```

**Страницы:**
- `/` - главная страница (header)
- `/auth/signin` - вход/регистрация
- `/auth/verify-code` - ввод кода 2FA

### В email письмах:

```html
<img src="http://localhost:3000/logo12.png" alt="ChargeFlow" style="width: 40px; height: 40px;">
```

**Письма:**
- Код подтверждения входа/регистрации
- Уведомление о входе в аккаунт
- Приветственное письмо

---

## 🎨 Стиль логотипа

### На страницах:
```tsx
<div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
  <Image src="/logo12.png" alt="ChargeFlow" width={40} height={40} />
</div>
```

- Размер: 40x40 пикселей
- Фон: белый круг
- Скругление: полный круг (rounded-full)

### В email:
```html
<div class="logo">
  <img src="..." alt="ChargeFlow">
  ChargeFlow
</div>
```

- Размер: 40x40 пикселей
- Расположение: рядом с текстом "ChargeFlow"
- Цвет текста: #10b981 (emerald-500)

---

## 📂 Расположение файла

```
public/
  └── logo12.png  ← Логотип здесь
```

**URL в браузере:** `http://localhost:3000/logo12.png`

**URL в email:** `${process.env.NEXTAUTH_URL}/logo12.png`

---

## 🔧 Как изменить логотип

### Шаг 1: Замените файл
Замените `public/logo12.png` на новый логотип (сохраните то же имя)

### Шаг 2: Перезапустите сервер
```bash
npm run dev
```

### Шаг 3: Очистите кеш браузера
- Chrome: Ctrl+Shift+R (Windows) или Cmd+Shift+R (Mac)
- Firefox: Ctrl+F5 (Windows) или Cmd+Shift+R (Mac)

---

## 🎯 Альтернатива: Использовать другой файл

Если хотите использовать другой файл (например, `logo-new.png`):

### 1. Обновите страницы:

**app/auth/signin/page.tsx:**
```tsx
<Image src="/logo-new.png" alt="ChargeFlow" width={40} height={40} />
```

**app/auth/verify-code/page.tsx:**
```tsx
<Image src="/logo-new.png" alt="ChargeFlow" width={40} height={40} />
```

### 2. Обновите email шаблоны:

**lib/email.ts:**
```typescript
const logoUrl = `${process.env.NEXTAUTH_URL}/logo-new.png`;
```

**lib/verification-code.ts:**
```typescript
const logoUrl = `${process.env.NEXTAUTH_URL}/logo-new.png`;
```

### 3. Пересоберите проект:
```bash
npm run build
```

---

## ✅ Проверка

### Веб-интерфейс:
1. Откройте http://localhost:3000/auth/signin
2. Логотип должен отображаться вместо ⚡

### Email:
1. Зарегистрируйтесь или войдите
2. Проверьте терминал - в HTML письма должен быть:
   ```html
   <img src="http://localhost:3000/logo12.png" alt="ChargeFlow">
   ```

---

## 🐛 Проблемы?

### Логотип не отображается на странице
**Решение:**
1. Проверьте, что файл `public/logo12.png` существует
2. Очистите кеш браузера (Ctrl+Shift+R)
3. Перезапустите сервер (`npm run dev`)

### Логотип не отображается в email
**Решение:**
1. Проверьте `NEXTAUTH_URL` в `.env` файле
2. Убедитесь, что URL правильный: `http://localhost:3000`
3. В production используйте реальный домен: `https://chargeflow.kg`

### Логотип слишком большой/маленький
**Решение:**
Измените размер в коде:
```tsx
// Было: width={40} height={40}
// Стало:
width={50} height={50}  // Больше
width={30} height={30}  // Меньше
```

---

## 📝 Файлы с логотипом

- ✅ `app/auth/signin/page.tsx`
- ✅ `app/auth/verify-code/page.tsx`
- ✅ `lib/email.ts`
- ✅ `lib/verification-code.ts`
- ✅ `app/page.tsx` (уже был)

Всего: **5 файлов** обновлено! 🎉
