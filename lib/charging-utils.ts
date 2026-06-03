/**
 * Утилиты для работы с зарядными сессиями
 */

// Типы коннекторов
export type ConnectorType = 'CCS2' | 'CHAdeMO' | 'Type2' | 'GB_T';

export interface ChargingCostParams {
  energyKwh: number;
  pricePerKwh: number;
}

export interface Station {
  id: string;
  name: string;
  connectorType: ConnectorType;
  powerKw: number;
  pricePerKwh: number;
}

export interface Vehicle {
  connectorType: ConnectorType;
  maxPowerKw: number;
}

export interface BookingTimeParams {
  startTime: Date;
  durationMinutes: number;
  currentTime?: Date;
}

/**
 * Расчёт стоимости зарядной сессии
 * Формула: стоимость = энергия × тариф_за_кВтч
 */
export function calculateChargingCost(params: ChargingCostParams): number {
  const { energyKwh, pricePerKwh } = params;
  
  // Стоимость по энергии
  const totalCost = energyKwh * pricePerKwh;
  
  // Округление до 2 знаков после запятой
  return Math.round(totalCost * 100) / 100;
}

/**
 * Фильтрация совместимых станций
 * Фильтрует по типу коннектора и мощности, сортирует по эффективности
 */
export function filterCompatibleStations(
  stations: Station[],
  vehicle: Vehicle
): Station[] {
  // Фильтрация по типу коннектора
  const compatibleByType = stations.filter(
    station => station.connectorType === vehicle.connectorType
  );
  
  // Фильтрация по мощности (станция не должна превышать maxPower авто)
  const compatibleByPower = compatibleByType.filter(
    station => station.powerKw <= vehicle.maxPowerKw
  );
  
  // Сортировка по эффективности (близость мощности к maxPower авто)
  // Чем ближе мощность станции к максимальной мощности авто, тем эффективнее
  const sorted = compatibleByPower.sort((a, b) => {
    const diffA = Math.abs(vehicle.maxPowerKw - a.powerKw);
    const diffB = Math.abs(vehicle.maxPowerKw - b.powerKw);
    return diffA - diffB;
  });
  
  return sorted;
}

/**
 * Валидация времени бронирования
 */
export function validateBookingTime(params: BookingTimeParams): {
  isValid: boolean;
  errors: string[];
} {
  const { startTime, durationMinutes, currentTime = new Date() } = params;
  const errors: string[] = [];
  
  // Проверка 1: Время начала не раньше текущего момента + 15 минут
  const minStartTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
  if (startTime < minStartTime) {
    errors.push('Время начала должно быть не раньше чем через 15 минут');
  }
  
  // Проверка 2: Длительность от 15 до 120 минут
  if (durationMinutes < 15) {
    errors.push('Минимальная длительность бронирования 15 минут');
  }
  if (durationMinutes > 120) {
    errors.push('Максимальная длительность бронирования 120 минут');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Проверка пересечения бронирований
 */
export function checkBookingOverlap(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date
): boolean {
  // Проверка пересечения временных интервалов
  return (
    (newStart >= existingStart && newStart < existingEnd) ||
    (newEnd > existingStart && newEnd <= existingEnd) ||
    (newStart <= existingStart && newEnd >= existingEnd)
  );
}

/**
 * Обработка платежа через Finik (мок)
 */
export interface PaymentParams {
  userId: string;
  amount: number;
  paymentId?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  error?: string;
}

export function processPaymentViaFinik(params: PaymentParams): PaymentResult {
  const { userId, amount, paymentId } = params;
  
  // Валидация
  if (amount <= 0) {
    return {
      success: false,
      paymentId: '',
      error: 'Сумма должна быть больше 0'
    };
  }
  
  if (!userId) {
    return {
      success: false,
      paymentId: '',
      error: 'ID пользователя обязателен'
    };
  }
  
  // Генерация ID платежа
  const generatedPaymentId = paymentId || `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Мок успешного платежа
  return {
    success: true,
    paymentId: generatedPaymentId
  };
}

/**
 * Проверка возможности запуска зарядной сессии
 */
export interface StartSessionParams {
  hasBooking: boolean;
  bookingStartTime?: Date;
  currentTime?: Date;
  userBalance: number;
  minBalance: number;
}

export interface StartSessionValidation {
  canStart: boolean;
  reason?: string;
}

export function validateStartChargingSession(params: StartSessionParams): StartSessionValidation {
  const {
    hasBooking,
    bookingStartTime,
    currentTime = new Date(),
    userBalance,
    minBalance
  } = params;
  
  // Проверка баланса
  if (userBalance < minBalance) {
    return {
      canStart: false,
      reason: 'Недостаточно средств на балансе'
    };
  }
  
  // Если есть бронирование, проверяем 15-минутное окно
  if (hasBooking && bookingStartTime) {
    const timeDiff = Math.abs(currentTime.getTime() - bookingStartTime.getTime());
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Окно: ±15 минут от времени начала бронирования
    if (minutesDiff > 15) {
      return {
        canStart: false,
        reason: 'Бронирование истекло (прошло более 15 минут)'
      };
    }
  }
  
  return {
    canStart: true
  };
}
