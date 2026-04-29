# Локализация (i18n)

Структура локализации для проекта ChargeFlow.

## Структура папок

```
app/i18n/
├── locales/
│   ├── kg/              # Кыргызский язык
│   │   └── landing.json
│   └── ru/              # Русский язык
│       └── landing.json
├── config.ts            # Конфигурация языков
├── utils.ts             # Утилиты для работы с переводами
├── index.ts             # Экспорты
└── README.md            # Документация
```

## Поддерживаемые языки

- **kg** - Кыргызский (Кыргызча) 🇰🇬
- **ru** - Русский 🇷🇺 (по умолчанию)

## Использование

### 1. Импорт переводов

```typescript
import { getTranslations } from '@/app/i18n';

// В серверном компоненте
const t = await getTranslations('ru', 'landing');
console.log(t.nav.logo); // "ChargeFlow"
```

### 2. Доступ к вложенным значениям

```typescript
import { getNestedValue } from '@/app/i18n/utils';

const value = getNestedValue(t, 'hero.title');
// "ChargeFlow — быстрая"
```

### 3. Структура переводов

Все переводы организованы по секциям страницы:

- `nav` - Навигация
- `hero` - Главная секция
- `features` - Возможности
- `howItWorks` - Как это работает
- `payment` - Оплата
- `app` - Приложение
- `pricing` - Тарифы
- `cta` - Призыв к действию
- `footer` - Подвал

## Добавление новых переводов

### Для новой страницы:

1. Создайте файл `app/i18n/locales/kg/[page-name].json`
2. Создайте файл `app/i18n/locales/ru/[page-name].json`
3. Добавьте переводы в JSON формате

Пример структуры:

```json
{
  "section": {
    "title": "Заголовок",
    "description": "Описание",
    "items": ["Элемент 1", "Элемент 2"]
  }
}
```

### Для нового языка:

1. Добавьте код языка в `config.ts`:
```typescript
export const locales = ['kg', 'ru', 'en'] as const;
```

2. Добавьте название и флаг:
```typescript
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

3. Создайте папку `app/i18n/locales/en/` и добавьте файлы переводов

## Примеры использования в компонентах

### Server Component

```typescript
import { getTranslations } from '@/app/i18n';

export default async function HomePage({ 
  params 
}: { 
  params: { locale: string } 
}) {
  const t = await getTranslations(params.locale as Locale, 'landing');
  
  return (
    <div>
      <h1>{t.hero.title}</h1>
      <p>{t.hero.description}</p>
    </div>
  );
}
```

### Client Component (с пропсами)

```typescript
'use client';

interface Props {
  translations: any;
}

export default function ClientComponent({ translations }: Props) {
  return (
    <button>{translations.nav.login}</button>
  );
}
```

## Рекомендации

1. **Именование ключей**: Используйте camelCase для ключей
2. **Структура**: Группируйте переводы по логическим секциям
3. **Массивы**: Используйте массивы для списков элементов
4. **Вложенность**: Не делайте вложенность более 3-4 уровней
5. **Консистентность**: Сохраняйте одинаковую структуру во всех языках

## Fallback

Если перевод не найден:
- Система попытается загрузить перевод из языка по умолчанию (ru)
- Если и там нет перевода, вернется ключ перевода

## Тестирование

Проверьте наличие всех ключей во всех языках:

```bash
# Сравните структуру файлов
diff <(jq -S 'keys' app/i18n/locales/kg/landing.json) \
     <(jq -S 'keys' app/i18n/locales/ru/landing.json)
```
