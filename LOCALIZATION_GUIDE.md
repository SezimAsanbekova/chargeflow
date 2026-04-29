# 🌍 Руководство по локализации ChargeFlow

## ✅ Что реализовано

Полная система локализации с поддержкой **кыргызского (kg)** и **русского (ru)** языков.

### Основные возможности:
- ✅ Переключатель языков в header
- ✅ Сохранение выбора в cookies
- ✅ Автоматическая загрузка переводов
- ✅ Все секции сайта переведены
- ✅ TypeScript типы для автодополнения

## 🚀 Как это работает

### 1. Выбор языка
Пользователь кликает на переключатель языков в header:
```
🇰🇬 Кыргызча  ▼
```

### 2. Сохранение в cookies
Выбранный язык сохраняется в cookie с именем `locale`:
- Значение: `kg` или `ru`
- Срок действия: 1 год
- Путь: `/` (доступен на всех страницах)

### 3. Загрузка переводов
При изменении языка автоматически загружаются переводы из:
- `app/i18n/locales/kg/landing.json` - для кыргызского
- `app/i18n/locales/ru/landing.json` - для русского

### 4. Обновление интерфейса
Все тексты на странице обновляются на выбранный язык.

## 📁 Структура файлов

```
app/
├── i18n/
│   ├── locales/
│   │   ├── kg/
│   │   │   └── landing.json      # Кыргызские переводы
│   │   └── ru/
│   │       └── landing.json      # Русские переводы
│   ├── components/
│   │   └── LanguageSwitcher.tsx  # Компонент переключателя
│   ├── config.ts                 # Конфигурация языков
│   ├── utils.ts                  # Утилиты загрузки
│   ├── cookies.ts                # Работа с cookies
│   ├── types.ts                  # TypeScript типы
│   └── index.ts                  # Экспорты
└── page.tsx                      # Главная страница (обновлена)
```

## 🔧 Технические детали

### Cookies
```typescript
// Имя cookie
LOCALE_COOKIE_NAME = 'locale'

// Значения
'kg' - кыргызский язык
'ru' - русский язык (по умолчанию)

// Параметры
path: '/'              // Доступен на всех страницах
max-age: 31536000      // 1 год
SameSite: 'Lax'        // Безопасность
```

### Функции

#### getLocaleCookie()
Читает значение языка из cookies:
```typescript
const locale = getLocaleCookie(); // 'kg' | 'ru' | null
```

#### setLocaleCookie(locale)
Сохраняет выбранный язык в cookies:
```typescript
setLocaleCookie('kg'); // Сохраняет кыргызский
```

#### getTranslations(locale, page)
Загружает переводы для указанного языка и страницы:
```typescript
const t = await getTranslations('kg', 'landing');
console.log(t.hero.title); // "ChargeFlow — тез"
```

## 🎯 Использование

### В компоненте
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getTranslations, getLocaleCookie, setLocaleCookie, type Locale } from '@/app/i18n';

export default function MyPage() {
  const [locale, setLocale] = useState<Locale>('ru');
  const [t, setT] = useState<any>(null);

  // Загрузка переводов
  useEffect(() => {
    getTranslations(locale, 'landing').then(setT);
  }, [locale]);

  // Восстановление из cookies
  useEffect(() => {
    const saved = getLocaleCookie();
    if (saved) setLocale(saved);
  }, []);

  // Обработчик изменения
  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleCookie(newLocale);
  };

  if (!t) return <div>Загрузка...</div>;

  return (
    <div>
      <h1>{t.hero.title}</h1>
      <LanguageSwitcher 
        currentLocale={locale}
        onLocaleChange={handleChange}
      />
    </div>
  );
}
```

## 📊 Переведенные секции

Все секции главной страницы полностью переведены:

1. **Навигация** - меню, кнопки
2. **Hero** - заголовок, описание, статистика
3. **Features** - 3 карточки возможностей
4. **How It Works** - 4 шага процесса
5. **Payment** - способы оплаты, счет
6. **App** - описание приложения, функции
7. **Pricing** - 3 тарифных плана
8. **CTA** - призыв к действию
9. **Footer** - ссылки, контакты, копирайт

## 🧪 Тестирование

### Проверка работы:
1. Запустите dev сервер: `npm run dev`
2. Откройте http://localhost:3000
3. Кликните на переключатель языков
4. Выберите кыргызский язык
5. Проверьте, что все тексты изменились
6. Обновите страницу - язык должен сохраниться

### Проверка cookies:
1. Откройте DevTools (F12)
2. Перейдите в Application → Cookies
3. Найдите cookie `locale`
4. Значение должно быть `kg` или `ru`

## 🎨 Кастомизация

### Изменить язык по умолчанию
В `app/i18n/config.ts`:
```typescript
export const defaultLocale: Locale = 'kg'; // Было 'ru'
```

### Добавить новый язык
1. Создайте папку `app/i18n/locales/en/`
2. Скопируйте `landing.json` и переведите
3. Обновите `config.ts`:
```typescript
export const locales = ['kg', 'ru', 'en'] as const;
export const localeNames = {
  kg: 'Кыргызча',
  ru: 'Русский',
  en: 'English',
};
export const localeFlags = {
  kg: '🇰🇬',
  ru: '🇷🇺',
  en: '🇬🇧',
};
```

### Изменить стили переключателя
В `app/i18n/components/LanguageSwitcher.tsx`:
```typescript
// Цвета
className="bg-blue-500/10 border-blue-500/30"

// Размер
className="px-6 py-3 text-lg"

// Позиция dropdown
className="absolute left-0 mt-2"
```

## 📝 Добавление новых переводов

### Для существующей страницы:
1. Откройте `app/i18n/locales/kg/landing.json`
2. Добавьте новый ключ:
```json
{
  "newSection": {
    "title": "Жаңы бөлүм"
  }
}
```
3. Добавьте в `app/i18n/locales/ru/landing.json`:
```json
{
  "newSection": {
    "title": "Новая секция"
  }
}
```
4. Используйте: `{t.newSection.title}`

## 🐛 Решение проблем

### Язык не сохраняется
- Проверьте, что cookies включены в браузере
- Проверьте, что вызывается `setLocaleCookie()`

### Переводы не загружаются
- Проверьте консоль браузера на ошибки
- Убедитесь, что JSON файлы валидны
- Проверьте путь к файлам переводов

### TypeScript ошибки
- Убедитесь, что типы в `types.ts` соответствуют JSON
- Перезапустите TypeScript сервер

## 📚 Дополнительная документация

Подробная документация находится в `app/i18n/`:
- `INDEX.md` - Навигация по документации
- `QUICKSTART.md` - Быстрый старт
- `INTEGRATION.md` - Подробная интеграция
- `CHEATSHEET.md` - Шпаргалка с кодом

## ✨ Готово!

Локализация полностью настроена и готова к использованию. Выбранный язык сохраняется в cookies и автоматически восстанавливается при следующем посещении.
