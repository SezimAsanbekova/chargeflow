# 🔊 Техническая документация: Голосовые подсказки

## Архитектура

### Компоненты

```
VoiceNavigator (Singleton)
├── Управление Web Speech API
├── Логика объявлений
├── Защита от повторений
└── Форматирование текста

NavigationSimulator
├── Отслеживание позиции
├── Вычисление расстояния до манёвра
└── Вызов VoiceNavigator

SimulationControls
└── Кнопка включения/выключения голоса
```

## VoiceNavigator Class

### Основные методы

#### `isAvailable(): boolean`
Проверяет доступность Web Speech API

```typescript
const voiceNavigator = getVoiceNavigator();
if (voiceNavigator.isAvailable()) {
  // Голос доступен
}
```

#### `setEnabled(enabled: boolean): void`
Включает/выключает голос

```typescript
voiceNavigator.setEnabled(true);  // Включить
voiceNavigator.setEnabled(false); // Выключить
```

#### `announceNavigationStart(stationName: string): void`
Объявляет начало навигации

```typescript
voiceNavigator.announceNavigationStart('Ала-Тоо');
// 🔊 "Начинаем движение до станции Ала-Тоо"
```

#### `announceManeuver(stepIndex, instruction, distanceToStep): void`
Объявляет манёвр с учётом расстояния

```typescript
voiceNavigator.announceManeuver(
  1,                      // Индекс шага
  'Поверните налево',     // Инструкция
  75                      // Расстояние в метрах
);
// 🔊 "Через 80 метров поверните налево"
```

#### `announceArrival(stationName: string): void`
Объявляет прибытие

```typescript
voiceNavigator.announceArrival('Ала-Тоо');
// 🔊 "Вы прибыли к месту назначения. Станция Ала-Тоо"
```

#### `announceNavigationEnd(): void`
Объявляет завершение навигации

```typescript
voiceNavigator.announceNavigationEnd();
// 🔊 "Навигация завершена"
```

#### `reset(): void`
Сбрасывает состояние

```typescript
voiceNavigator.reset();
```

### Внутренние методы

#### `shouldAnnounceManeuver(stepIndex, distanceToStep): boolean`
Определяет, нужно ли объявлять манёвр

**Логика:**
1. Если новый шаг - проверяем пороги (100м, 50м, 20м)
2. Если тот же шаг - проверяем изменение расстояния
3. Защита от повторений - округление до 10м

```typescript
// Пример внутренней логики
if (stepIndex !== this.lastAnnouncedStep) {
  // Новый шаг - проверяем пороги
  for (const threshold of [100, 50]) {
    if (distanceToStep <= threshold && distanceToStep > threshold - 20) {
      return true;
    }
  }
}
```

#### `formatAnnouncement(instruction, distanceToStep): string`
Форматирует текст объявления

**Примеры:**
- `distance = 150` → "через 150 метров поверните налево"
- `distance = 75` → "через 80 метров поверните налево" (округление)
- `distance = 15` → "поверните налево" (без расстояния)

#### `formatInstruction(instruction): string`
Форматирует инструкцию для произношения

**Преобразования:**
- "Начните движение" → "начинайте движение"
- "Вы прибыли" → "вы прибыли к месту назначения"
- "Круговое движение" → "круговое движение"
- "Поверните налево" → "поверните налево"
- "Поверните направо" → "поверните направо"
- "Резко поверните налево" → "резко поверните налево"
- "Слегка поверните направо" → "поверните слегка направо"
- "В конце дороги поверните налево" → "в конце дороги поверните налево"
- "Развилка влево" → "на развилке держитесь левее"
- "Продолжайте движение прямо" → "продолжайте движение прямо"

## Интеграция

### В NavigationSimulator

```typescript
import { getVoiceNavigator } from '../utils/voiceNavigator';

export function NavigationSimulator({ stationName, ... }) {
  const voiceNavigator = getVoiceNavigator();
  
  // При запуске
  useEffect(() => {
    if (isActive) {
      voiceNavigator.announceNavigationStart(stationName);
    }
  }, [isActive]);
  
  // При обновлении шага
  const updateStepProgress = (currentPosition) => {
    // ... вычисления ...
    voiceNavigator.announceManeuver(
      currentStepIndex,
      instruction,
      distanceToStep
    );
  };
}
```

### В SimulationControls

```typescript
import { getVoiceNavigator } from '../utils/voiceNavigator';

export function SimulationControls() {
  const voiceNavigator = getVoiceNavigator();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(
    voiceNavigator.getEnabled()
  );
  
  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    voiceNavigator.setEnabled(newState);
    setIsVoiceEnabled(newState);
  };
  
  return (
    <button onClick={toggleVoice}>
      {isVoiceEnabled ? <Volume2 /> : <VolumeX />}
    </button>
  );
}
```

### В page.tsx

```typescript
const stopSimulation = () => {
  const { getVoiceNavigator } = require('./utils/voiceNavigator');
  const voiceNavigator = getVoiceNavigator();
  voiceNavigator.announceNavigationEnd();
  voiceNavigator.reset();
  // ...
};

const handleSimulationArrival = useCallback(() => {
  const { getVoiceNavigator } = require('./utils/voiceNavigator');
  const voiceNavigator = getVoiceNavigator();
  voiceNavigator.announceArrival(selectedStation.name);
  // ...
}, [selectedStation]);
```

## Web Speech API

### Параметры SpeechSynthesisUtterance

```typescript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'ru-RU';      // Русский язык
utterance.rate = 1.0;          // Нормальная скорость
utterance.pitch = 1.0;         // Нормальная высота
utterance.volume = 0.8;        // 80% громкости
```

### События

```typescript
utterance.onstart = () => {
  // Начало произношения
  this.isSpeaking = true;
};

utterance.onend = () => {
  // Конец произношения
  this.isSpeaking = false;
};

utterance.onerror = (event) => {
  // Ошибка
  console.error('Voice error:', event);
};
```

### Управление

```typescript
// Произнести
window.speechSynthesis.speak(utterance);

// Остановить
window.speechSynthesis.cancel();

// Проверить, говорит ли
window.speechSynthesis.speaking; // boolean
```

## Алгоритм работы

### 1. Инициализация

```
NavigationSimulator создаётся
  ↓
getVoiceNavigator() возвращает singleton
  ↓
Проверка доступности Web Speech API
  ↓
Готов к работе
```

### 2. Начало навигации

```
Пользователь нажимает "Старт"
  ↓
NavigationSimulator.useEffect срабатывает
  ↓
voiceNavigator.announceNavigationStart(stationName)
  ↓
🔊 "Начинаем движение до станции [название]"
```

### 3. Во время движения

```
Каждые 100ms обновляется позиция
  ↓
updateStepProgress() вычисляет расстояние до шага
  ↓
voiceNavigator.announceManeuver(...)
  ↓
shouldAnnounceManeuver() проверяет условия
  ↓
Если нужно - formatAnnouncement() форматирует текст
  ↓
speak() произносит через Web Speech API
```

### 4. Защита от повторений

```
Новое объявление запрошено
  ↓
Проверка: уже говорит? → Да → Пропустить
  ↓ Нет
Проверка: тот же шаг? → Да → Проверить расстояние
  ↓ Нет
Проверка: в пределах порогов? → Да → Объявить
  ↓ Нет
Пропустить
```

### 5. Завершение

```
Прибытие к станции
  ↓
voiceNavigator.announceArrival(stationName)
  ↓
🔊 "Вы прибыли к месту назначения. Станция [название]"
  ↓
Выход из навигации
  ↓
voiceNavigator.announceNavigationEnd()
  ↓
🔊 "Навигация завершена"
  ↓
voiceNavigator.reset()
```

## Оптимизации

### 1. Singleton Pattern

```typescript
let voiceNavigatorInstance: VoiceNavigator | null = null;

export function getVoiceNavigator(): VoiceNavigator {
  if (!voiceNavigatorInstance) {
    voiceNavigatorInstance = new VoiceNavigator();
  }
  return voiceNavigatorInstance;
}
```

**Преимущества:**
- Одна инстанция на всё приложение
- Сохранение состояния между компонентами
- Меньше потребление памяти

### 2. Округление расстояний

```typescript
const currentThreshold = Math.floor(distanceToStep / 10) * 10;
```

**Преимущества:**
- Избегаем объявлений каждый метр
- Объявляем только при значительном изменении
- Более естественное поведение

### 3. Приоритеты объявлений

```typescript
private speak(text: string, priority: 'high' | 'normal' = 'normal'): void {
  if (this.isSpeakingNow() && priority !== 'high') {
    return; // Пропускаем
  }
  
  if (priority === 'high') {
    this.stop(); // Останавливаем текущее
  }
}
```

**Приоритеты:**
- `high` - начало/конец навигации, прибытие
- `normal` - обычные манёвры

## Тестирование

### Unit тесты

```typescript
describe('VoiceNavigator', () => {
  it('should announce navigation start', () => {
    const voice = new VoiceNavigator();
    voice.announceNavigationStart('Test Station');
    // Проверить, что speak() был вызван
  });
  
  it('should not repeat announcements', () => {
    const voice = new VoiceNavigator();
    voice.announceManeuver(0, 'Turn left', 75);
    voice.announceManeuver(0, 'Turn left', 74); // Не должно объявить
    // Проверить, что speak() вызван только 1 раз
  });
});
```

### Интеграционные тесты

```typescript
describe('Navigation with Voice', () => {
  it('should announce at 100m and 50m', async () => {
    // Запустить симуляцию
    // Проверить объявления на 100м и 50м
  });
  
  it('should announce arrival', async () => {
    // Запустить симуляцию до конца
    // Проверить объявление прибытия
  });
});
```

## Отладка

### Логирование

```typescript
console.log('[Voice] Speaking:', text);
console.log('[Voice] Started speaking');
console.log('[Voice] Finished speaking');
console.log('[Voice] Skipping announcement (already speaking):', text);
```

### Проверка состояния

```typescript
const voice = getVoiceNavigator();
console.log('Available:', voice.isAvailable());
console.log('Enabled:', voice.getEnabled());
console.log('Speaking:', voice.isSpeakingNow());
```

## Известные ограничения

### Safari iOS

- Web Speech API может не работать
- Требуется пользовательское взаимодействие
- Качество голоса ниже

### Решение

```typescript
if (!voiceNavigator.isAvailable()) {
  // Показать предупреждение
  alert('Голосовые подсказки недоступны в вашем браузере');
}
```

## Будущие улучшения

- [ ] Выбор голоса (мужской/женский)
- [ ] Настройка громкости
- [ ] Настройка скорости речи
- [ ] Поддержка других языков
- [ ] Кастомные фразы
- [ ] История объявлений

---

**Версия**: 1.1.0
**Дата**: 2026-05-07
**Автор**: Development Team
