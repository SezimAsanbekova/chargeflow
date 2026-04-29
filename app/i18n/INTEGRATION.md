# Инструкция по интеграции локализации

## Быстрый старт

### Шаг 1: Проверьте структуру

Убедитесь, что созданы следующие файлы:

```
app/i18n/
├── locales/
│   ├── kg/landing.json
│   └── ru/landing.json
├── components/
│   └── LanguageSwitcher.tsx
├── examples/
│   └── page-with-i18n.tsx
├── config.ts
├── utils.ts
├── types.ts
├── index.ts
├── README.md
└── INTEGRATION.md (этот файл)
```

### Шаг 2: Базовое использование

#### Вариант А: Простое использование (без роутинга по языкам)

Добавьте состояние языка в ваш компонент:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getTranslations } from '@/app/i18n';
import { defaultLocale, type Locale } from '@/app/i18n/config';
import LanguageSwitcher from '@/app/i18n/components/LanguageSwitcher';

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    // Загрузка переводов
    getTranslations(locale, 'landing').then(setT);
    
    // Сохранение выбора в localStorage
    localStorage.setItem('locale', locale);
  }, [locale]);

  useEffect(() => {
    // Восстановление выбора языка
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale) {
      setLocale(savedLocale);
    }
  }, []);

  if (!t) return <div>Loading...</div>;

  return (
    <div>
      {/* Переключатель языка */}
      <LanguageSwitcher 
        currentLocale={locale} 
        onLocaleChange={setLocale} 
      />
      
      {/* Использование переводов */}
      <h1>{t.hero.title}</h1>
      <p>{t.hero.description}</p>
    </div>
  );
}
```

#### Вариант Б: С роутингом по языкам (рекомендуется)

1. Создайте структуру папок:

```
app/
├── [locale]/
│   ├── layout.tsx
│   └── page.tsx
└── i18n/
```

2. Создайте `app/[locale]/layout.tsx`:

```typescript
import { locales } from '@/app/i18n/config';
import type { Locale } from '@/app/i18n/config';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  return children;
}
```

3. Создайте `app/[locale]/page.tsx`:

```typescript
import { getTranslations } from '@/app/i18n';
import type { Locale } from '@/app/i18n/config';

interface PageProps {
  params: { locale: Locale };
}

export default async function HomePage({ params }: PageProps) {
  const t = await getTranslations(params.locale, 'landing');

  return (
    <div>
      <h1>{t.hero.title}</h1>
      <p>{t.hero.description}</p>
    </div>
  );
}
```

4. Настройте редиректы в `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/app/i18n/config';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Проверяем, есть ли язык в URL
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Редирект на язык по умолчанию
  const locale = defaultLocale;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

### Шаг 3: Добавьте переключатель языка

В навигацию добавьте компонент `LanguageSwitcher`:

```typescript
import LanguageSwitcher from '@/app/i18n/components/LanguageSwitcher';
import { useRouter, usePathname } from 'next/navigation';
import type { Locale } from '@/app/i18n/config';

function Navigation({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Заменяем язык в URL
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <nav>
      {/* ... другие элементы навигации ... */}
      <LanguageSwitcher 
        currentLocale={currentLocale}
        onLocaleChange={handleLocaleChange}
      />
    </nav>
  );
}
```

## Примеры использования

### Пример 1: Простой текст

```typescript
<h1>{t.hero.title}</h1>
```

### Пример 2: Массив элементов

```typescript
{t.features.smartSearch.connectors.map((connector, idx) => (
  <span key={idx}>{connector}</span>
))}
```

### Пример 3: Вложенные объекты

```typescript
<div>
  <h3>{t.payment.methods.card.title}</h3>
  <p>{t.payment.methods.card.description}</p>
</div>
```

### Пример 4: Условный рендеринг

```typescript
{locale === 'kg' ? (
  <span>Кыргызча контент</span>
) : (
  <span>Русский контент</span>
)}
```

## Добавление новых переводов

### Для существующей страницы:

1. Откройте `app/i18n/locales/kg/landing.json`
2. Добавьте новый ключ:

```json
{
  "newSection": {
    "title": "Жаңы бөлүм",
    "description": "Сүрөттөмө"
  }
}
```

3. Добавьте тот же ключ в `app/i18n/locales/ru/landing.json`:

```json
{
  "newSection": {
    "title": "Новая секция",
    "description": "Описание"
  }
}
```

4. Обновите типы в `app/i18n/types.ts`:

```typescript
export interface LandingTranslations {
  // ... существующие поля
  newSection: {
    title: string;
    description: string;
  };
}
```

### Для новой страницы:

1. Создайте `app/i18n/locales/kg/about.json`
2. Создайте `app/i18n/locales/ru/about.json`
3. Добавьте интерфейс в `app/i18n/types.ts`:

```typescript
export interface AboutTranslations {
  title: string;
  content: string;
}
```

4. Обновите `TranslationMap` в `utils.ts`:

```typescript
type TranslationMap = {
  landing: LandingTranslations;
  about: AboutTranslations;
};
```

5. Обновите тип `TranslationPage`:

```typescript
export type TranslationPage = 'landing' | 'about';
```

## Тестирование

### Проверка всех переводов:

```bash
# Установите jq если нужно
brew install jq  # macOS
# или
sudo apt-get install jq  # Linux

# Проверьте структуру
diff <(jq -S 'keys' app/i18n/locales/kg/landing.json) \
     <(jq -S 'keys' app/i18n/locales/ru/landing.json)
```

### Проверка в браузере:

1. Запустите dev сервер: `npm run dev`
2. Откройте `http://localhost:3000/ru` (русский)
3. Откройте `http://localhost:3000/kg` (кыргызский)
4. Проверьте переключение языков

## Troubleshooting

### Проблема: Переводы не загружаются

**Решение:**
- Проверьте путь к файлам переводов
- Убедитесь, что JSON файлы валидны
- Проверьте консоль браузера на ошибки

### Проблема: TypeScript ошибки

**Решение:**
- Убедитесь, что типы в `types.ts` соответствуют структуре JSON
- Перезапустите TypeScript сервер в VSCode

### Проблема: Переводы не обновляются

**Решение:**
- Очистите кэш Next.js: `rm -rf .next`
- Перезапустите dev сервер

## Best Practices

1. **Всегда используйте типы** - это предотвратит ошибки
2. **Группируйте переводы логически** - по секциям страницы
3. **Используйте короткие ключи** - но понятные
4. **Не дублируйте переводы** - выносите общие в отдельную секцию
5. **Тестируйте оба языка** - перед коммитом
6. **Документируйте изменения** - в комментариях к коммитам

## Дополнительные возможности

### Форматирование чисел:

```typescript
const formatter = new Intl.NumberFormat(locale === 'kg' ? 'ky-KG' : 'ru-RU');
formatter.format(1234.56); // "1 234,56"
```

### Форматирование дат:

```typescript
const dateFormatter = new Intl.DateTimeFormat(
  locale === 'kg' ? 'ky-KG' : 'ru-RU',
  { year: 'numeric', month: 'long', day: 'numeric' }
);
dateFormatter.format(new Date()); // "29 апреля 2026 г."
```

### Плюрализация:

```typescript
function pluralize(count: number, locale: Locale) {
  if (locale === 'kg') {
    return count === 1 ? 'станция' : 'станциялар';
  } else {
    if (count % 10 === 1 && count % 100 !== 11) return 'станция';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'станции';
    return 'станций';
  }
}
```

## Полезные ссылки

- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [JSON Schema Validator](https://www.jsonschemavalidator.net/)
