// Утилита для валидации безопасности пароля

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Проверяет безопасность пароля
 * Требования:
 * - Минимум 8 символов
 * - Минимум 1 заглавная буква
 * - Минимум 1 строчная буква
 * - Минимум 1 цифра
 * - Минимум 1 специальный символ (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Проверка длины
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }

  // Проверка на заглавные буквы
  if (!/[A-Z]/.test(password) && !/[А-ЯЁ]/.test(password)) {
    errors.push('Пароль должен содержать минимум 1 заглавную букву');
  }

  // Проверка на строчные буквы
  if (!/[a-z]/.test(password) && !/[а-яё]/.test(password)) {
    errors.push('Пароль должен содержать минимум 1 строчную букву');
  }

  // Проверка на цифры
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать минимум 1 цифру');
  }

  // Проверка на специальные символы
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Пароль должен содержать минимум 1 специальный символ (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Генерирует случайный безопасный пароль
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Гарантируем наличие каждого типа символов
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Заполняем остальное случайными символами
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Перемешиваем символы
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
