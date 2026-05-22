/**
 * Voice Navigator - управление голосовыми подсказками для навигации
 * Работает через Web Speech API
 */

export class VoiceNavigator {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled: boolean = true;
  private isSpeaking: boolean = false;
  private lastAnnouncedStep: number = -1;
  private lastAnnouncedDistance: number = -1;
  private announcementThresholds = [200, 100, 50]; // Метры для объявлений (по умолчанию для 40 км/ч)
  private currentSpeed: number = 40; // км/ч
  private isInitialized: boolean = false;
  private locale: string = 'ru';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.initialize();
    }
  }

  /**
   * Установить локаль для голосовой навигации
   */
  setLocale(locale: string): void {
    this.locale = locale;
  }

  /**
   * Установить текущую скорость движения и адаптировать пороги объявлений
   */
  setSpeed(speedKmh: number): void {
    this.currentSpeed = speedKmh;
    this.announcementThresholds = this.calculateThresholds(speedKmh);
  }

  /**
   * Расчёт порогов объявлений в зависимости от скорости
   * Чем выше скорость, тем раньше нужно объявлять манёвр
   */
  private calculateThresholds(speedKmh: number): number[] {
    // Время реакции водителя (в секундах) на разных скоростях
    // Дальний порог: ~15 секунд до манёвра
    // Средний порог: ~7 секунд до манёвра
    // Ближний порог: ~3 секунды до манёвра
    
    const speedMps = (speedKmh * 1000) / 3600; // м/с
    
    const farThreshold = Math.round(speedMps * 15 / 50) * 50;     // округление до 50м
    const midThreshold = Math.round(speedMps * 7 / 25) * 25;      // округление до 25м
    const nearThreshold = Math.round(speedMps * 3 / 10) * 10;     // округление до 10м
    
    // Минимальные значения чтобы не было слишком близко
    return [
      Math.max(farThreshold, 150),
      Math.max(midThreshold, 75),
      Math.max(nearThreshold, 30)
    ];
  }

  /**
   * Инициализация голосового синтеза
   */
  private initialize(): void {
    if (!this.synthesis || this.isInitialized) {
      return;
    }

    try {
      // Загружаем список голосов
      const loadVoices = () => {
        const voices = this.synthesis?.getVoices() || [];
        this.isInitialized = true;
      };

      // Голоса могут загружаться асинхронно
      if (this.synthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        this.synthesis.addEventListener('voiceschanged', loadVoices, { once: true });
      }
    } catch (error) {
      console.error('[Voice] Initialization error:', error);
    }
  }

  /**
   * Проверка доступности голосового синтеза
   */
  isAvailable(): boolean {
    return this.synthesis !== null;
  }

  /**
   * Включить/выключить голос
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.isSpeaking) {
      this.stop();
    }
  }

  /**
   * Получить статус голоса
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Проверка, говорит ли голос сейчас
   */
  isSpeakingNow(): boolean {
    return this.isSpeaking || (this.synthesis?.speaking ?? false);
  }

  /**
   * Остановить текущее произношение
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Произнести текст
   */
  private speak(text: string, priority: 'high' | 'normal' = 'normal'): void {
    if (!this.isEnabled || !this.synthesis) {
      return;
    }

    // Проверка на пустой текст
    if (!text || text.trim().length === 0) {
      return;
    }

    // Проверка доступности синтеза речи
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // Если уже говорит и приоритет не высокий - пропускаем
    if (this.isSpeakingNow() && priority !== 'high') {
      return;
    }

    // Если высокий приоритет - останавливаем текущее
    if (priority === 'high' && this.isSpeakingNow()) {
      this.stop();
    }

    try {
      console.log('🔊 Голос:', text);

      const utterance = new SpeechSynthesisUtterance(text);
      // Устанавливаем язык в зависимости от локали
      utterance.lang = this.locale === 'kg' ? 'ky-KG' : 'ru-RU';
      utterance.rate = 0.95; // Чуть медленнее для лучшей разборчивости
      utterance.pitch = 1.0; // Нормальная высота
      utterance.volume = 1.0; // Полная громкость для четкости
      
      // Пытаемся выбрать голос в зависимости от локали
      const voices = this.synthesis.getVoices();
      let selectedVoice;
      
      if (this.locale === 'kg') {
        // Для кыргызского: пробуем ky, затем tr (близкий тюркский), затем ru
        selectedVoice = 
          voices.find(v => v.lang.startsWith('ky')) ||
          voices.find(v => v.lang.startsWith('tr')) ||
          voices.find(v => v.lang === 'ru-RU' && v.localService) ||
          voices.find(v => v.lang.startsWith('ru'));
      } else {
        // Для русского
        selectedVoice = 
          voices.find(v => v.lang === 'ru-RU' && v.localService) ||
          voices.find(v => v.lang.startsWith('ru')) ||
          voices.find(v => v.name.toLowerCase().includes('milena')) ||
          voices.find(v => v.name.toLowerCase().includes('yuri')) ||
          voices.find(v => v.name.toLowerCase().includes('alyona'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
      };

      this.currentUtterance = utterance;
      
      // Небольшая задержка перед произношением для стабильности
      setTimeout(() => {
        // Проверяем, что synthesis все еще доступен и страница видима
        if (!this.synthesis || !this.currentUtterance) {
          return;
        }
        
        // Проверяем видимость страницы (если скрыта, не произносим)
        if (typeof document !== 'undefined' && document.hidden) {
          this.isSpeaking = false;
          this.currentUtterance = null;
          return;
        }
        
        try {
          this.synthesis.speak(this.currentUtterance);
        } catch (speakError) {
          this.isSpeaking = false;
          this.currentUtterance = null;
        }
      }, 50);
      
    } catch (error) {
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Объявить начало навигации
   */
  announceNavigationStart(stationName: string): void {
    this.lastAnnouncedStep = -1;
    this.lastAnnouncedDistance = -1;
    const text = this.locale === 'kg'
      ? `${stationName} станциясына жолго чыгабыз`
      : `Начинаем движение до станции ${stationName}`;
    this.speak(text, 'high');
  }

  /**
   * Объявить завершение навигации
   */
  announceNavigationEnd(): void {
    const text = this.locale === 'kg' ? 'Навигация аякталды' : 'Навигация завершена';
    this.speak(text, 'high');
  }

  /**
   * Объявить прибытие
   */
  announceArrival(stationName: string): void {
    const text = this.locale === 'kg'
      ? `Сиз көздөгөн жериңизге жеттиңиз. ${stationName} станциясы`
      : `Вы прибыли к месту назначения. Станция ${stationName}`;
    this.speak(text, 'high');
  }

  /**
   * Объявить манёвр с учётом расстояния
   */
  announceManeuver(
    stepIndex: number,
    instruction: string,
    distanceToStep: number
  ): void {
    if (!this.isEnabled || !this.synthesis) {
      return;
    }

    // Если уже говорит - не перебиваем
    if (this.isSpeakingNow()) {
      return;
    }

    // Определяем, нужно ли объявлять
    const shouldAnnounce = this.shouldAnnounceManeuver(
      stepIndex,
      distanceToStep
    );

    if (!shouldAnnounce) {
      return;
    }

    // Формируем текст объявления
    const announcement = this.formatAnnouncement(instruction, distanceToStep);
    
    // Запоминаем, что объявили
    this.lastAnnouncedStep = stepIndex;
    this.lastAnnouncedDistance = Math.floor(distanceToStep / 10) * 10; // Округляем до 10м

    // Произносим
    this.speak(announcement, 'normal');
  }

  /**
   * Проверка, нужно ли объявлять манёвр
   */
  private shouldAnnounceManeuver(
    stepIndex: number,
    distanceToStep: number
  ): boolean {
    // Окно объявления зависит от скорости
    const speedMps = (this.currentSpeed * 1000) / 3600;
    const announceWindow = Math.max(40, Math.round(speedMps * 2)); // 2 секунды или минимум 40м
    
    // Если это новый шаг
    if (stepIndex !== this.lastAnnouncedStep) {
      // Объявляем, если расстояние в пределах порогов
      for (const threshold of this.announcementThresholds) {
        if (distanceToStep <= threshold && distanceToStep > threshold - announceWindow) {
          return true;
        }
      }
      
      // Или если очень близко - объявляем сразу
      const minThreshold = this.announcementThresholds[this.announcementThresholds.length - 1];
      if (distanceToStep <= minThreshold) {
        return true;
      }
    } else {
      // Если тот же шаг - проверяем, не пора ли объявить снова
      const currentThreshold = Math.floor(distanceToStep / 10) * 10;
      
      if (currentThreshold !== this.lastAnnouncedDistance) {
        for (const threshold of this.announcementThresholds) {
          if (distanceToStep <= threshold && distanceToStep > threshold - announceWindow) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Форматирование текста объявления
   */
  private formatAnnouncement(instruction: string, distanceToStep: number): string {
    const distance = Math.round(distanceToStep);

    // Если очень близко - объявляем без расстояния
    if (distance <= 30) {
      return this.formatInstruction(instruction);
    }

    // Округляем расстояние для произношения с правильным склонением
    let distanceText = '';
    const prefix = this.locale === 'kg' ? '' : 'через ';
    const suffix = this.locale === 'kg' ? ' кийин' : '';
    
    if (distance >= 1000) {
      const km = distance / 1000;
      const kmRounded = Math.round(km * 10) / 10;
      distanceText = `${prefix}${this.formatKilometers(kmRounded)}${suffix}`;
    } else if (distance >= 100) {
      const rounded = Math.round(distance / 50) * 50;
      distanceText = `${prefix}${rounded} ${this.getMetersWord(rounded)}${suffix}`;
    } else {
      const rounded = Math.round(distance / 10) * 10;
      distanceText = `${prefix}${rounded} ${this.getMetersWord(rounded)}${suffix}`;
    }

    const formattedInstruction = this.formatInstruction(instruction);
    return this.locale === 'kg'
      ? `${distanceText}, ${formattedInstruction}`
      : `${distanceText}, ${formattedInstruction}`;
  }

  /**
   * Правильное склонение слова "метр"
   */
  private getMetersWord(meters: number): string {
    if (this.locale === 'kg') {
      return 'метр';
    }
    const lastDigit = meters % 10;
    const lastTwoDigits = meters % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'метров';
    if (lastDigit === 1) return 'метр';
    if (lastDigit >= 2 && lastDigit <= 4) return 'метра';
    return 'метров';
  }

  /**
   * Правильное склонение слова "километр"
   */
  private formatKilometers(km: number): string {
    if (this.locale === 'kg') {
      return `${km === Math.floor(km) ? Math.floor(km) : km.toFixed(1).replace('.', ',')} километр`;
    }
    
    // Целое или дробное
    if (km === Math.floor(km)) {
      const intKm = Math.floor(km);
      const lastDigit = intKm % 10;
      const lastTwoDigits = intKm % 100;
      
      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${intKm} километров`;
      if (lastDigit === 1) return `${intKm} километр`;
      if (lastDigit >= 2 && lastDigit <= 4) return `${intKm} километра`;
      return `${intKm} километров`;
    }
    
    // Дробные числа всегда "километра"
    return `${km.toFixed(1).replace('.', ',')} километра`;
  }

  /**
   * Форматирование инструкции для произношения
   * ВАЖНО: проверяем "направо" ПЕРЕД "налево", потому что слово "направо" 
   * содержит "право", а не "лево". Аналогично для других пар.
   */
  private formatInstruction(instruction: string): string {
    // Для кыргызского языка инструкция уже приходит переведённая из i18n
    if (this.locale === 'kg') {
      return instruction.toLowerCase();
    }
    
    const lower = instruction.toLowerCase().trim();

    // Специальные случаи (проверяем первыми)
    if (lower.includes('начните движение') || lower.includes('начало движения') || lower.includes('начинайте')) {
      return 'начинайте движение';
    }

    if (lower.includes('прибыли') || lower.includes('прибытие') || lower.includes('место назначения')) {
      return 'вы прибыли к месту назначения';
    }

    if (lower.includes('круг') || lower.includes('roundabout') || lower.includes('кольц')) {
      return 'въезжайте на круговое движение';
    }

    if (lower.includes('перестрой')) {
      return 'перестройтесь';
    }

    // ============ ПРАВО (проверяем ПЕРВЫМ из-за пересечения букв) ============
    // Используем точное совпадение слов через границы слов
    const isRight = /\b(направо|правее|вправо)\b/i.test(lower) || 
                    (/\bправ/i.test(lower) && !/\bлев/i.test(lower));
    
    // ============ ЛЕВО ============
    const isLeft = /\b(налево|левее|влево)\b/i.test(lower) || 
                   (/\bлев/i.test(lower) && !/\bправ/i.test(lower));

    // Обработка поворота НАПРАВО
    if (isRight) {
      if (lower.includes('развилк')) {
        return 'на развилке держитесь правее';
      }
      if (lower.includes('конце дороги') || lower.includes('конец дороги')) {
        return 'в конце дороги поверните направо';
      }
      if (lower.includes('резко')) {
        return 'резко поверните направо';
      }
      if (lower.includes('слегка') || lower.includes('немного')) {
        return 'поверните слегка направо';
      }
      return 'поверните направо';
    }

    // Обработка поворота НАЛЕВО
    if (isLeft) {
      if (lower.includes('развилк')) {
        return 'на развилке держитесь левее';
      }
      if (lower.includes('конце дороги') || lower.includes('конец дороги')) {
        return 'в конце дороги поверните налево';
      }
      if (lower.includes('резко')) {
        return 'резко поверните налево';
      }
      if (lower.includes('слегка') || lower.includes('немного')) {
        return 'поверните слегка налево';
      }
      return 'поверните налево';
    }

    // Обработка прямого движения
    if (lower.includes('прямо') || lower.includes('продолжайте') || lower.includes('продолжить')) {
      return 'продолжайте движение прямо';
    }

    // Возвращаем как есть, но в нижнем регистре для естественности
    return instruction.toLowerCase();
  }

  /**
   * Сброс состояния
   */
  reset(): void {
    this.stop();
    this.lastAnnouncedStep = -1;
    this.lastAnnouncedDistance = -1;
  }
}

// Singleton instance
let voiceNavigatorInstance: VoiceNavigator | null = null;

export function getVoiceNavigator(): VoiceNavigator {
  if (!voiceNavigatorInstance) {
    voiceNavigatorInstance = new VoiceNavigator();
  }
  return voiceNavigatorInstance;
}
