# 📋 Шпаргалка по локализации

## ⚡ Быстрые команды

```bash
# Проверка JSON
node -e "JSON.parse(require('fs').readFileSync('app/i18n/locales/kg/landing.json'))"

# Сравнение структуры (требует jq)
diff <(jq -S 'keys' app/i18n/locales/kg/landing.json) \
     <(jq -S 'keys' app/i18n/locales/ru/landing.json)

# Подсчет ключей
jq 'paths | length' app/i18n/locales/ru/landing.json

# Поиск текста в переводах
grep -r "Зарядка" app/i18n/locales/
```

## 🔧 Импорты

```typescript
// Основные
import { getTranslations } from '@/app/i18n';
import { locales, defaultLocale, type Locale } from '@/app/i18n/config';
import LanguageSwitcher from '@/app/i18n/components/LanguageSwitcher';

// Типы
import type { LandingTranslations } from '@/app/i18n/types';
```

## 📝 Использование

### Server Component
```typescript
export default async function Page({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations(params.locale, 'landing');
  return <h1>{t.hero.title}</h1>;
}
```

### Client Component
```typescript
'use client';
import { useState, useEffect } from 'react';

export default function Page() {
  const [locale, setLocale] = useState<Locale>('ru');
  const [t, setT] = useState<any>(null);
  
  useEffect(() => {
    getTranslations(locale, 'landing').then(setT);
  }, [locale]);
  
  if (!t) return <div>Loading...</div>;
  return <h1>{t.hero.title}</h1>;
}
```

## 🎯 Частые паттерны

### Простой текст
```typescript
{t.hero.title}
```

### Массив
```typescript
{t.features.smartSearch.connectors.map((c, i) => (
  <span key={i}>{c}</span>
))}
```

### Вложенный объект
```typescript
{t.payment.methods.card.title}
{t.payment.methods.card.description}
```

### Условный рендеринг
```typescript
{locale === 'kg' ? t.kg.text : t.ru.text}
```

## 🔄 Переключение языка

### С роутингом
```typescript
const router = useRouter();
const pathname = usePathname();

const handleChange = (newLocale: Locale) => {
  const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
  router.push(newPath);
};
```

### Без роутинга
```typescript
const [locale, setLocale] = useState<Locale>('ru');

const handleChange = (newLocale: Locale) => {
  setLocale(newLocale);
  localStorage.setItem('locale', newLocale);
};
```

## 📂 Структура JSON

```json
{
  "section": {
    "title": "string",
    "items": ["array"],
    "nested": {
      "key": "value"
    }
  }
}
```

## 🆕 Добавление перевода

### 1. В JSON
```json
// app/i18n/locales/kg/landing.json
{
  "newSection": {
    "title": "Жаңы бөлүм"
  }
}

// app/i18n/locales/ru/landing.json
{
  "newSection": {
    "title": "Новая секция"
  }
}
```

### 2. В типах (опционально)
```typescript
// app/i18n/types.ts
export interface LandingTranslations {
  // ...
  newSection: {
    title: string;
  };
}
```

### 3. Использование
```typescript
<h2>{t.newSection.title}</h2>
```

## 🌍 Добавление языка

### 1. Создать папку
```bash
mkdir app/i18n/locales/en
```

### 2. Скопировать файлы
```bash
cp app/i18n/locales/ru/landing.json app/i18n/locales/en/landing.json
```

### 3. Обновить config.ts
```typescript
export const locales = ['kg', 'ru', 'en'] as const;

export const localeNames: Record<Locale, string> = {
  kg: 'Кыргызча',
  ru: 'Русский',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  kg: '🇰🇬',
  ru: '🇷🇺',
  en: '🇬🇧',
};
```

## 📄 Добавление страницы

### 1. Создать JSON файлы
```bash
touch app/i18n/locales/kg/about.json
touch app/i18n/locales/ru/about.json
```

### 2. Добавить интерфейс
```typescript
// app/i18n/types.ts
export interface AboutTranslations {
  title: string;
  content: string;
}
```

### 3. Обновить utils.ts
```typescript
type TranslationMap = {
  landing: LandingTranslations;
  about: AboutTranslations;
};

export type TranslationPage = 'landing' | 'about';
```

### 4. Использовать
```typescript
const t = await getTranslations('kg', 'about');
```

## 🎨 Стилизация LanguageSwitcher

```typescript
// Изменить цвета
className="bg-blue-500/10 border-blue-500/30"

// Изменить размер
className="px-6 py-3 text-lg"

// Изменить позицию dropdown
className="absolute left-0 mt-2"

// Только флаги
<span>{localeFlags[locale]}</span>
```

## 🐛 Отладка

### Проверить загрузку
```typescript
const t = await getTranslations('kg', 'landing');
console.log('Loaded:', t);
```

### Проверить ключ
```typescript
console.log('Title:', t.hero.title);
console.log('Type:', typeof t.hero.title);
```

### Проверить fallback
```typescript
// Попробуйте несуществующий язык
const t = await getTranslations('xx' as Locale, 'landing');
// Должен загрузиться defaultLocale (ru)
```

## 📊 Полезные функции

### Форматирование чисел
```typescript
const formatter = new Intl.NumberFormat(
  locale === 'kg' ? 'ky-KG' : 'ru-RU'
);
formatter.format(1234.56); // "1 234,56"
```

### Форматирование дат
```typescript
const dateFormatter = new Intl.DateTimeFormat(
  locale === 'kg' ? 'ky-KG' : 'ru-RU',
  { year: 'numeric', month: 'long', day: 'numeric' }
);
dateFormatter.format(new Date());
```

### Плюрализация (русский)
```typescript
function pluralize(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) return 'станция';
  if (count % 10 >= 2 && count % 10 <= 4 && 
      (count % 100 < 10 || count % 100 >= 20)) return 'станции';
  return 'станций';
}
```

## 🔍 Поиск и замена

### Найти хардкод текстов
```bash
# Найти русские тексты в JSX
grep -r "\"[А-Яа-я]" app/ --include="*.tsx"

# Найти кыргызские тексты
grep -r "\"[Ө-өҮ-ү]" app/ --include="*.tsx"
```

### Заменить на переводы
```typescript
// Было
<h1>Возможности</h1>

// Стало
<h1>{t.nav.features}</h1>
```

## 🧪 Тестирование

### Проверка всех ключей
```typescript
const kg = await getTranslations('kg', 'landing');
const ru = await getTranslations('ru', 'landing');

const kgKeys = JSON.stringify(Object.keys(kg).sort());
const ruKeys = JSON.stringify(Object.keys(ru).sort());

console.assert(kgKeys === ruKeys, 'Keys mismatch!');
```

### Проверка типов
```typescript
const t: LandingTranslations = await getTranslations('kg', 'landing');
// TypeScript проверит соответствие типов
```

## 📦 Middleware (для роутинга)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/app/i18n/config';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (pathnameHasLocale) return;
  
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

## 🎯 SEO

### Мета-теги
```typescript
export async function generateMetadata({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations(params.locale, 'landing');
  
  return {
    title: t.hero.title,
    description: t.hero.description,
    alternates: {
      languages: {
        'kg': '/kg',
        'ru': '/ru',
      },
    },
  };
}
```

### hreflang теги
```typescript
<link rel="alternate" hrefLang="kg" href="https://example.com/kg" />
<link rel="alternate" hrefLang="ru" href="https://example.com/ru" />
<link rel="alternate" hrefLang="x-default" href="https://example.com/ru" />
```

## 💾 Сохранение выбора

### localStorage
```typescript
// Сохранить
localStorage.setItem('locale', locale);

// Загрузить
const savedLocale = localStorage.getItem('locale') as Locale;
```

### Cookies
```typescript
// Сохранить
document.cookie = `locale=${locale}; path=/; max-age=31536000`;

// Загрузить
const locale = document.cookie
  .split('; ')
  .find(row => row.startsWith('locale='))
  ?.split('=')[1];
```

## 🚀 Оптимизация

### Code splitting
```typescript
// Динамический импорт
const t = await import(`./locales/${locale}/landing.json`);
```

### Предзагрузка
```typescript
// Предзагрузить оба языка
Promise.all([
  getTranslations('kg', 'landing'),
  getTranslations('ru', 'landing'),
]);
```

## 📱 Определение языка браузера

```typescript
const browserLocale = navigator.language.split('-')[0];
const defaultLocale = locales.includes(browserLocale as Locale) 
  ? browserLocale as Locale 
  : 'ru';
```

## 🔗 Полезные ссылки

- [Next.js i18n](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 📞 Поддержка

Если что-то не работает:
1. Проверьте консоль браузера
2. Проверьте валидность JSON
3. Проверьте импорты
4. Проверьте типы TypeScript
5. Перезапустите dev сервер

---

**Версия:** 1.0.0  
**Обновлено:** 29 апреля 2026
