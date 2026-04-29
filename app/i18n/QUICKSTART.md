# 🚀 Быстрый старт - Локализация за 5 минут

## ✅ Что уже готово

- ✓ Структура папок создана
- ✓ Переводы на кыргызский и русский готовы
- ✓ TypeScript типы настроены
- ✓ Компонент переключателя языков готов
- ✓ Документация написана

## 🎯 Выберите способ интеграции

### Способ 1: Простая интеграция (5 минут)

Подходит для быстрого старта без изменения структуры роутинга.

#### Шаг 1: Обновите `app/page.tsx`

Замените первые строки файла:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { /* ... ваши иконки ... */ } from "lucide-react";
import { getTranslations } from '@/app/i18n';
import { defaultLocale, type Locale } from '@/app/i18n/config';
import LanguageSwitcher from '@/app/i18n/components/LanguageSwitcher';

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    getTranslations(locale, 'landing').then(setT);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale) setLocale(savedLocale);
    }
  }, []);

  if (!t) return <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
    <div className="text-emerald-400">Загрузка...</div>
  </div>;

  return (
    <div className="min-h-screen bg-[#0a1f1a]">
      {/* Навигация */}
      <nav className="fixed top-0 w-full bg-[#0a1f1a]/95 backdrop-blur-sm z-50 border-b border-emerald-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* ... */}
          
          {/* ДОБАВЬТЕ ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА */}
          <LanguageSwitcher 
            currentLocale={locale} 
            onLocaleChange={setLocale} 
          />
        </div>
      </nav>
      
      {/* Замените все тексты на переводы */}
      <h1>{t.hero.title}</h1>
      {/* ... остальной код ... */}
    </div>
  );
}
```

#### Шаг 2: Замените тексты

Найдите и замените:

| Было | Стало |
|------|-------|
| `"ChargeFlow"` | `{t.nav.logo}` |
| `"Возможности"` | `{t.nav.features}` |
| `"Войти"` | `{t.nav.login}` |
| И так далее... | |

**Совет:** Используйте файл `examples/page-with-i18n.tsx` как референс.

#### Шаг 3: Тестируйте

```bash
npm run dev
```

Откройте http://localhost:3000 и проверьте переключение языков.

---

### Способ 2: С роутингом (15 минут, рекомендуется)

Подходит для SEO и правильной архитектуры.

#### Шаг 1: Создайте структуру роутинга

```bash
mkdir -p app/\[locale\]
```

#### Шаг 2: Переместите файлы

```bash
# Переместите page.tsx
mv app/page.tsx app/[locale]/page.tsx

# Если есть другие файлы в app/, переместите их тоже
# mv app/about/page.tsx app/[locale]/about/page.tsx
```

#### Шаг 3: Создайте `app/[locale]/layout.tsx`

```typescript
import { locales, type Locale } from '@/app/i18n/config';

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

#### Шаг 4: Обновите `app/[locale]/page.tsx`

```typescript
import { getTranslations } from '@/app/i18n';
import type { Locale } from '@/app/i18n/config';
// ... остальные импорты

interface PageProps {
  params: { locale: Locale };
}

export default async function HomePage({ params }: PageProps) {
  const t = await getTranslations(params.locale, 'landing');

  return (
    <div className="min-h-screen bg-[#0a1f1a]">
      <h1>{t.hero.title}</h1>
      {/* ... */}
    </div>
  );
}
```

#### Шаг 5: Создайте `middleware.ts` в корне проекта

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
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

#### Шаг 6: Обновите навигацию

```typescript
'use client';

import { useRouter, usePathname } from 'next/navigation';
import LanguageSwitcher from '@/app/i18n/components/LanguageSwitcher';
import type { Locale } from '@/app/i18n/config';

function Navigation({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <nav>
      {/* ... */}
      <LanguageSwitcher 
        currentLocale={currentLocale}
        onLocaleChange={handleLocaleChange}
      />
    </nav>
  );
}
```

#### Шаг 7: Тестируйте

```bash
npm run dev
```

Откройте:
- http://localhost:3000 → редирект на `/ru`
- http://localhost:3000/ru → русская версия
- http://localhost:3000/kg → кыргызская версия

---

## 🎨 Кастомизация LanguageSwitcher

### Изменить стили

Отредактируйте `app/i18n/components/LanguageSwitcher.tsx`:

```typescript
// Измените цвета
className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"

// Измените размер
className="px-6 py-3 text-lg"

// Измените позицию dropdown
className="absolute left-0 mt-2"  // вместо right-0
```

### Добавить флаги вместо текста

```typescript
<span className="text-2xl">{localeFlags[currentLocale]}</span>
// Вместо
<span>{localeNames[currentLocale]}</span>
```

---

## 📝 Частые задачи

### Добавить новый перевод

1. Откройте `app/i18n/locales/kg/landing.json`
2. Добавьте ключ:
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

### Добавить новый язык

1. Создайте папку: `app/i18n/locales/en/`
2. Скопируйте `landing.json` и переведите
3. Обновите `app/i18n/config.ts`:
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

### Добавить новую страницу

1. Создайте `app/i18n/locales/kg/about.json`
2. Создайте `app/i18n/locales/ru/about.json`
3. Добавьте интерфейс в `app/i18n/types.ts`:
```typescript
export interface AboutTranslations {
  title: string;
  content: string;
}
```
4. Обновите `app/i18n/utils.ts`:
```typescript
type TranslationMap = {
  landing: LandingTranslations;
  about: AboutTranslations;
};

export type TranslationPage = 'landing' | 'about';
```
5. Используйте:
```typescript
const t = await getTranslations('kg', 'about');
```

---

## 🐛 Решение проблем

### Переводы не загружаются

**Проблема:** `Cannot find module './locales/kg/landing.json'`

**Решение:**
```bash
# Проверьте структуру
ls -la app/i18n/locales/kg/

# Должен быть файл landing.json
```

### TypeScript ошибки

**Проблема:** `Property 'hero' does not exist on type 'TranslationKeys'`

**Решение:**
```typescript
// Убедитесь, что используете правильный тип
const t = await getTranslations('kg', 'landing');
// Не используйте 'any'
```

### Переключатель не работает

**Проблема:** Язык не меняется при клике

**Решение:**
```typescript
// Проверьте, что onLocaleChange вызывается
const handleLocaleChange = (newLocale: Locale) => {
  console.log('Changing to:', newLocale);  // Добавьте лог
  setLocale(newLocale);
};
```

### Стили не применяются

**Проблема:** LanguageSwitcher выглядит неправильно

**Решение:**
```bash
# Убедитесь, что Tailwind настроен
npm run dev

# Проверьте, что в tailwind.config есть:
content: [
  "./app/**/*.{js,ts,jsx,tsx}",
]
```

---

## ✅ Чеклист готовности

Перед деплоем проверьте:

- [ ] Все JSON файлы валидны (нет синтаксических ошибок)
- [ ] Оба языка работают (kg и ru)
- [ ] Переключатель языков работает
- [ ] Все тексты переведены (нет хардкода)
- [ ] TypeScript не показывает ошибок
- [ ] Тесты проходят (если есть)
- [ ] SEO мета-теги обновлены для каждого языка
- [ ] Роутинг работает корректно

---

## 🎉 Готово!

Теперь ваше приложение поддерживает два языка!

### Следующие шаги:

1. **Добавьте больше переводов** - переведите остальные страницы
2. **Улучшите SEO** - добавьте hreflang теги
3. **Добавьте аналитику** - отслеживайте выбор языка
4. **Оптимизируйте** - используйте code splitting для переводов

### Полезные ссылки:

- 📖 [Полная документация](./README.md)
- 🔧 [Инструкция по интеграции](./INTEGRATION.md)
- 📊 [Структура проекта](./STRUCTURE.md)
- 📝 [Краткая сводка](./SUMMARY.md)

---

**Нужна помощь?** Проверьте документацию или создайте issue.
