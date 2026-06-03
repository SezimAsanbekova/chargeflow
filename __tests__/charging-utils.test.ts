/**
 * Тесты функций зарядки
 */

import {
  calculateChargingCost,
  filterCompatibleStations,
  validateBookingTime,
  checkBookingOverlap,
  processPaymentViaFinik,
  validateStartChargingSession,
  type Station,
  type Vehicle,
  type ConnectorType
} from '@/lib/charging-utils';

describe('Функции зарядки', () => {
  
  // ========== ФУНКЦИЯ 1: calculateChargingCost() (4 теста) ==========
  
  describe('calculateChargingCost()', () => {
    // Тест 1: Расчёт по энергии
    test('расчёт стоимости по энергии', () => {
      // Формула: стоимость = энергия × тариф_за_кВтч
      const result = calculateChargingCost({
        energyKwh: 10,
        pricePerKwh: 15
      });
      
      // 10 кВт·ч × 15 сом/кВт·ч = 150 сом
      expect(result).toBe(150);
    });

    // Тест 2: Расчёт с дробными значениями
    test('расчёт с дробными значениями энергии', () => {
      const result = calculateChargingCost({
        energyKwh: 7.5,
        pricePerKwh: 20
      });
      
      // 7.5 × 20 = 150 сом
      expect(result).toBe(150);
    });

    // Тест 3: Округление до 2 знаков
    test('округление до 2 знаков после запятой', () => {
      const result = calculateChargingCost({
        energyKwh: 7.5,
        pricePerKwh: 14.33
      });
      
      // 7.5 × 14.33 = 107.475 → 107.48 сом
      expect(result).toBe(107.48);
    });

    // Тест 4: Нулевая стоимость при нулевой энергии
    test('нулевая стоимость при нулевой энергии', () => {
      const result = calculateChargingCost({
        energyKwh: 0,
        pricePerKwh: 15
      });
      
      expect(result).toBe(0);
    });
  });

  // ========== ФУНКЦИЯ 2: filterCompatibleStations() (4 теста) ==========
  
  describe('filterCompatibleStations()', () => {
    const stations: Station[] = [
      { id: '1', name: 'Станция A', connectorType: 'CCS2', powerKw: 50, pricePerKwh: 15 },
      { id: '2', name: 'Станция B', connectorType: 'CCS2', powerKw: 150, pricePerKwh: 18 },
      { id: '3', name: 'Станция C', connectorType: 'CHAdeMO', powerKw: 50, pricePerKwh: 16 },
      { id: '4', name: 'Станция D', connectorType: 'CCS2', powerKw: 100, pricePerKwh: 17 },
      { id: '5', name: 'Станция E', connectorType: 'Type2', powerKw: 22, pricePerKwh: 12 },
    ];

    // Тест 5: Фильтрация по типу коннектора
    test('фильтрация по типу коннектора', () => {
      const vehicle: Vehicle = {
        connectorType: 'CCS2',
        maxPowerKw: 150
      };
      
      const result = filterCompatibleStations(stations, vehicle);
      
      // Должны остаться только станции с CCS2
      expect(result.length).toBe(3);
      expect(result.every(s => s.connectorType === 'CCS2')).toBe(true);
    });

    // Тест 6: Фильтрация по мощности
    test('фильтрация по мощности', () => {
      const vehicle: Vehicle = {
        connectorType: 'CCS2',
        maxPowerKw: 100
      };
      
      const result = filterCompatibleStations(stations, vehicle);
      
      // Станция B (150 кВт) должна быть отфильтрована
      expect(result.length).toBe(2);
      expect(result.every(s => s.powerKw <= 100)).toBe(true);
    });

    // Тест 7: Сортировка по эффективности
    test('сортировка по эффективности', () => {
      const vehicle: Vehicle = {
        connectorType: 'CCS2',
        maxPowerKw: 100
      };
      
      const result = filterCompatibleStations(stations, vehicle);
      
      // Первой должна быть станция с мощностью ближе к 100 кВт
      expect(result[0].id).toBe('4'); // Станция D (100 кВт)
      expect(result[1].id).toBe('1'); // Станция A (50 кВт)
    });

    // Тест 8: Пустой результат при отсутствии совместимых
    test('пустой результат при отсутствии совместимых', () => {
      const vehicle: Vehicle = {
        connectorType: 'GB_T',
        maxPowerKw: 150
      };
      
      const result = filterCompatibleStations(stations, vehicle);
      
      expect(result.length).toBe(0);
    });
  });

  // ========== ФУНКЦИЯ 3: validateBookingTime() (4 теста) ==========
  
  describe('validateBookingTime()', () => {
    // Тест 9: Время начала не раньше +15 минут
    test('время начала не раньше текущего момента + 15 минут', () => {
      const currentTime = new Date('2024-01-01T10:00:00Z');
      const startTime = new Date('2024-01-01T10:20:00Z');
      
      const result = validateBookingTime({
        startTime,
        durationMinutes: 60,
        currentTime
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    // Тест 10: Ошибка при раннем времени начала
    test('ошибка при времени начала раньше +15 минут', () => {
      const currentTime = new Date('2024-01-01T10:00:00Z');
      const startTime = new Date('2024-01-01T10:10:00Z');
      
      const result = validateBookingTime({
        startTime,
        durationMinutes: 60,
        currentTime
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Время начала должно быть не раньше чем через 15 минут');
    });

    // Тест 11: Длительность от 15 до 120 минут
    test('длительность от 15 до 120 минут', () => {
      const currentTime = new Date('2024-01-01T10:00:00Z');
      const startTime = new Date('2024-01-01T11:00:00Z');
      
      // Валидная длительность
      const valid = validateBookingTime({
        startTime,
        durationMinutes: 60,
        currentTime
      });
      expect(valid.isValid).toBe(true);
      
      // Слишком короткая
      const tooShort = validateBookingTime({
        startTime,
        durationMinutes: 10,
        currentTime
      });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors).toContain('Минимальная длительность бронирования 15 минут');
      
      // Слишком длинная
      const tooLong = validateBookingTime({
        startTime,
        durationMinutes: 150,
        currentTime
      });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors).toContain('Максимальная длительность бронирования 120 минут');
    });

    // Тест 12: Проверка пересечения бронирований
    test('проверка пересечения бронирований', () => {
      const newStart = new Date('2024-01-01T10:00:00Z');
      const newEnd = new Date('2024-01-01T11:00:00Z');
      const existingStart = new Date('2024-01-01T10:30:00Z');
      const existingEnd = new Date('2024-01-01T11:30:00Z');
      
      const hasOverlap = checkBookingOverlap(newStart, newEnd, existingStart, existingEnd);
      
      expect(hasOverlap).toBe(true);
    });
  });

  // ========== ФУНКЦИЯ 4: processPaymentViaFinik() (5 тестов) ==========
  
  describe('processPaymentViaFinik()', () => {
    // Тест 13: Успешное создание платежа
    test('успешное создание платежа', () => {
      const result = processPaymentViaFinik({
        userId: 'user123',
        amount: 500
      });
      
      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();
      expect(result.paymentId.startsWith('PAY_')).toBe(true);
    });

    // Тест 14: Обработка успешного платежа
    test('обработка успешного платежа', () => {
      const result = processPaymentViaFinik({
        userId: 'user123',
        amount: 1000
      });
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    // Тест 15: Ошибка при нулевой сумме
    test('ошибка при нулевой или отрицательной сумме', () => {
      const result = processPaymentViaFinik({
        userId: 'user123',
        amount: 0
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Сумма должна быть больше 0');
    });

    // Тест 16: Ошибка при отсутствии userId
    test('ошибка при отсутствии userId', () => {
      const result = processPaymentViaFinik({
        userId: '',
        amount: 500
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID пользователя обязателен');
    });

    // Тест 17: Защита от двойной обработки
    test('защита от двойной обработки одного платежа', () => {
      const paymentId = 'PAY_TEST_123';
      
      const result1 = processPaymentViaFinik({
        userId: 'user123',
        amount: 500,
        paymentId
      });
      
      const result2 = processPaymentViaFinik({
        userId: 'user123',
        amount: 500,
        paymentId
      });
      
      // Оба запроса должны вернуть один и тот же paymentId
      expect(result1.paymentId).toBe(paymentId);
      expect(result2.paymentId).toBe(paymentId);
    });
  });

  // ========== ФУНКЦИЯ 5: validateStartChargingSession() (5 тестов) ==========
  
  describe('validateStartChargingSession()', () => {
    // Тест 18: Запуск по активному бронированию
    test('запуск по активному бронированию в пределах ±15 минут', () => {
      const currentTime = new Date('2024-01-01T10:10:00Z');
      const bookingStartTime = new Date('2024-01-01T10:00:00Z');
      
      const result = validateStartChargingSession({
        hasBooking: true,
        bookingStartTime,
        currentTime,
        userBalance: 500,
        minBalance: 100
      });
      
      expect(result.canStart).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    // Тест 19: Запуск без бронирования
    test('запуск без бронирования при достаточном балансе', () => {
      const result = validateStartChargingSession({
        hasBooking: false,
        userBalance: 500,
        minBalance: 100
      });
      
      expect(result.canStart).toBe(true);
    });

    // Тест 20: Запрет при недостаточном балансе
    test('запрет запуска при недостаточном балансе', () => {
      const result = validateStartChargingSession({
        hasBooking: false,
        userBalance: 50,
        minBalance: 100
      });
      
      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('Недостаточно средств на балансе');
    });

    // Тест 21: Запрет при истекшем бронировании
    test('запрет при истекшем бронировании (>15 минут)', () => {
      const currentTime = new Date('2024-01-01T10:20:00Z');
      const bookingStartTime = new Date('2024-01-01T10:00:00Z');
      
      const result = validateStartChargingSession({
        hasBooking: true,
        bookingStartTime,
        currentTime,
        userBalance: 500,
        minBalance: 100
      });
      
      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('Бронирование истекло (прошло более 15 минут)');
    });

    // Тест 22: Граничный случай 15 минут
    test('граничный случай ровно 15 минут', () => {
      const currentTime = new Date('2024-01-01T10:15:00Z');
      const bookingStartTime = new Date('2024-01-01T10:00:00Z');
      
      const result = validateStartChargingSession({
        hasBooking: true,
        bookingStartTime,
        currentTime,
        userBalance: 500,
        minBalance: 100
      });
      
      expect(result.canStart).toBe(true);
    });
  });
});
