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
  private announcementThresholds = [200, 100, 50]; // Метры для объявлений
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.initialize();
    }
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
        console.log('[Voice] Available voices:', voices.length);
        
        // Ищем русский голос
        const russianVoice = voices.find(voice => voice.lang.startsWith('ru'));
        if (russianVoice) {
          console.log('[Voice] Russian voice found:', russianVoice.name);
        } else {
          console.warn('[Voice] No Russian voice found, will use default');
        }
        
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
      console.warn('[Voice] Empty text, skipping');
      return;
    }

    // Проверка доступности синтеза речи
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[Voice] Speech synthesis not available');
      return;
    }

    // Если уже говорит и приоритет не высокий - пропускаем
    if (this.isSpeakingNow() && priority !== 'high') {
      console.log('[Voice] Skipping announcement (already speaking):', text);
      return;
    }

    // Если высокий приоритет - останавливаем текущее
    if (priority === 'high' && this.isSpeakingNow()) {
      this.stop();
    }

    try {
      console.log('[Voice] Speaking:', text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.0; // Нормальная скорость
      utterance.pitch = 1.0; // Нормальная высота
      utterance.volume = 0.8; // Средняя громкость (80%)
      
      // Пытаемся выбрать русский голос, если доступен
      const voices = this.synthesis.getVoices();
      const russianVoice = voices.find(voice => voice.lang.startsWith('ru'));
      if (russianVoice) {
        utterance.voice = russianVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('[Voice] Started speaking');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        console.log('[Voice] Finished speaking');
      };

      utterance.onerror = (event) => {
        // Более детальная обработка ошибок
        const errorType = (event as any).error || 'unknown';
        
        // Некоторые ошибки не критичны и их можно игнорировать
        if (errorType === 'interrupted' || errorType === 'canceled') {
          // Это нормальное поведение - голос был прерван или отменен
          console.log('[Voice] Speech was interrupted or canceled (non-critical)');
        } else if (errorType === 'not-allowed') {
          console.warn('[Voice] Speech not allowed - check browser permissions');
        } else if (errorType === 'network') {
          console.warn('[Voice] Network error - voice synthesis unavailable');
        } else if (errorType === 'synthesis-failed' || errorType === 'synthesis-unavailable') {
          console.warn('[Voice] Speech synthesis failed or unavailable');
        } else if (errorType === 'unknown' || !errorType) {
          // Пустые или неизвестные ошибки часто не критичны - игнорируем
          console.log('[Voice] Non-critical speech event (ignored)');
        } else {
          // Только для действительно неожиданных ошибок
          console.warn('[Voice] Unexpected speech error:', errorType);
        }
        
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
          console.log('[Voice] Page is hidden, skipping speech');
          this.isSpeaking = false;
          this.currentUtterance = null;
          return;
        }
        
        try {
          this.synthesis.speak(this.currentUtterance);
        } catch (speakError) {
          console.warn('[Voice] Error calling speak():', speakError);
          this.isSpeaking = false;
          this.currentUtterance = null;
        }
      }, 50);
      
    } catch (error) {
      console.error('[Voice] Exception while speaking:', error);
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
    this.speak(`Начинаем движение до станции ${stationName}`, 'high');
  }

  /**
   * Объявить завершение навигации
   */
  announceNavigationEnd(): void {
    this.speak('Навигация завершена', 'high');
  }

  /**
   * Объявить прибытие
   */
  announceArrival(stationName: string): void {
    this.speak(`Вы прибыли к месту назначения. Станция ${stationName}`, 'high');
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
      console.log('[Voice] Skipping: voice disabled or synthesis unavailable');
      return;
    }

    // Если уже говорит - не перебиваем
    if (this.isSpeakingNow()) {
      console.log('[Voice] Skipping: already speaking');
      return;
    }

    // Определяем, нужно ли объявлять
    const shouldAnnounce = this.shouldAnnounceManeuver(
      stepIndex,
      distanceToStep
    );

    if (!shouldAnnounce) {
      console.log(`[Voice] Skipping: step=${stepIndex}, distance=${Math.round(distanceToStep)}m, lastStep=${this.lastAnnouncedStep}, lastDist=${this.lastAnnouncedDistance}m`);
      return;
    }

    // Формируем текст объявления
    const announcement = this.formatAnnouncement(instruction, distanceToStep);
    
    console.log(`[Voice] ✅ Announcing: step=${stepIndex}, distance=${Math.round(distanceToStep)}m, text="${announcement}"`);
    
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
    console.log(`[Voice] Checking: step=${stepIndex}, distance=${Math.round(distanceToStep)}m, lastStep=${this.lastAnnouncedStep}, lastDist=${this.lastAnnouncedDistance}m`);
    
    // Если это новый шаг
    if (stepIndex !== this.lastAnnouncedStep) {
      console.log('[Voice] New step detected');
      
      // Объявляем, если расстояние в пределах порогов
      // Используем более широкий диапазон: threshold-30 до threshold
      for (const threshold of this.announcementThresholds) {
        if (distanceToStep <= threshold && distanceToStep > threshold - 30) {
          console.log(`[Voice] ✅ Within threshold ${threshold}m (range: ${threshold-30}-${threshold}m)`);
          return true;
        }
      }
      
      // Или если очень близко (меньше 30м) - объявляем сразу
      if (distanceToStep <= 30) {
        console.log('[Voice] ✅ Very close (<30m)');
        return true;
      }
      
      console.log('[Voice] ❌ New step but distance not in announcement range');
    } else {
      // Если тот же шаг - проверяем, не пора ли объявить снова
      // (например, было 200м, теперь 100м, потом 50м)
      const currentThreshold = Math.floor(distanceToStep / 10) * 10;
      
      console.log(`[Voice] Same step, currentThreshold=${currentThreshold}m`);
      
      if (currentThreshold !== this.lastAnnouncedDistance) {
        for (const threshold of this.announcementThresholds) {
          if (distanceToStep <= threshold && distanceToStep > threshold - 30) {
            console.log(`[Voice] ✅ Distance changed, within threshold ${threshold}m`);
            return true;
          }
        }
        console.log('[Voice] ❌ Distance changed but not in announcement range');
      } else {
        console.log('[Voice] ❌ Same distance threshold');
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
    if (distance <= 20) {
      return this.formatInstruction(instruction);
    }

    // Округляем расстояние для произношения
    let distanceText = '';
    if (distance >= 1000) {
      const km = (distance / 1000).toFixed(1);
      distanceText = `через ${km} километра`;
    } else if (distance >= 100) {
      const rounded = Math.round(distance / 50) * 50; // Округляем до 50м
      distanceText = `через ${rounded} метров`;
    } else {
      const rounded = Math.round(distance / 10) * 10; // Округляем до 10м
      distanceText = `через ${rounded} метров`;
    }

    const formattedInstruction = this.formatInstruction(instruction);
    return `${distanceText} ${formattedInstruction}`;
  }

  /**
   * Форматирование инструкции для произношения
   */
  private formatInstruction(instruction: string): string {
    const lower = instruction.toLowerCase();

    // Специальные случаи для лучшего произношения
    if (lower.includes('начните движение') || lower.includes('начало')) {
      return 'начинайте движение';
    }

    if (lower.includes('прибыли') || lower.includes('прибытие') || lower.includes('место назначения')) {
      return 'вы прибыли к месту назначения';
    }

    if (lower.includes('круг') || lower.includes('roundabout')) {
      return 'круговое движение';
    }

    // Обработка поворотов - ВАЖНО: проверяем в правильном порядке
    // Сначала проверяем "налево", потом "направо", чтобы избежать путаницы
    if (lower.includes('налево')) {
      if (lower.includes('резко')) {
        return 'резко поверните налево';
      } else if (lower.includes('слегка')) {
        return 'поверните слегка налево';
      } else if (lower.includes('конце дороги')) {
        return 'в конце дороги поверните налево';
      } else {
        return 'поверните налево';
      }
    }

    if (lower.includes('направо')) {
      if (lower.includes('резко')) {
        return 'резко поверните направо';
      } else if (lower.includes('слегка')) {
        return 'поверните слегка направо';
      } else if (lower.includes('конце дороги')) {
        return 'в конце дороги поверните направо';
      } else {
        return 'поверните направо';
      }
    }

    // Обработка развилок
    if (lower.includes('развилк')) {
      if (lower.includes('лев')) {
        return 'на развилке держитесь левее';
      } else if (lower.includes('прав')) {
        return 'на развилке держитесь правее';
      }
      return 'развилка';
    }

    // Обработка прямого движения
    if (lower.includes('прямо') || lower.includes('продолжайте')) {
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
