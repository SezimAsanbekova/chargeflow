/**
 * Валидаторы для аутентификации и регистрации
 */

import { validatePassword } from './password-validator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Валидация данных регистрации
 */
export function validateRegisterInput(
  email?: string,
  password?: string
): ValidationResult {
  const errors: string[] = [];

  // Проверка email
  if (!email) {
    errors.push('Email обязателен');
  } else if (!isValidEmail(email)) {
    errors.push('Неверный формат email');
  }

  // Проверка пароля
  if (!password) {
    errors.push('Пароль обязателен');
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация данных входа
 */
export function validateLoginInput(
  email?: string,
  password?: string
): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email обязателен');
  } else if (!isValidEmail(email)) {
    errors.push('Неверный формат email');
  }

  if (!password) {
    errors.push('Пароль обязателен');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация кода верификации
 */
export function validateVerificationCode(code?: string): ValidationResult {
  const errors: string[] = [];

  if (!code) {
    errors.push('Код верификации обязателен');
  } else if (!/^\d{6}$/.test(code)) {
    errors.push('Код должен состоять из 6 цифр');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация email формата
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Проверка блокировки аккаунта
 */
export function isAccountLocked(lockedUntil: Date | null): {
  isLocked: boolean;
  minutesLeft?: number;
} {
  if (!lockedUntil) {
    return { isLocked: false };
  }

  const now = new Date();
  if (now < lockedUntil) {
    const minutesLeft = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
    return { isLocked: true, minutesLeft };
  }

  return { isLocked: false };
}

/**
 * Проверка необходимости блокировки после неудачных попыток
 */
export function shouldLockAccount(loginAttempts: number): boolean {
  return loginAttempts >= 5;
}

/**
 * Получение времени блокировки (1 час от текущего момента)
 */
export function getLockUntilTime(): Date {
  const lockUntil = new Date();
  lockUntil.setHours(lockUntil.getHours() + 1);
  return lockUntil;
}
