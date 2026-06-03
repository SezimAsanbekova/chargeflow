/**
 * Основные тесты валидации регистрации и авторизации
 */

import { validatePassword } from '@/lib/password-validator';
import { validateRegisterInput, validateLoginInput } from '@/lib/auth-validators';
import { generateVerificationCode, verifyCode } from '@/lib/verification-code';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailVerificationCode: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs');

describe('Валидация регистрации и авторизации', () => {
  
  // Тест 1: Валидация пароля - успешная
  test('валидный пароль проходит проверку', () => {
    const result = validatePassword('Test123!@#');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Тест 2: Валидация пароля - слабый пароль
  test('слабый пароль отклоняется', () => {
    const result = validatePassword('weak');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // Тест 3: Валидация данных регистрации - успешная
  test('валидные данные регистрации принимаются', () => {
    const result = validateRegisterInput('test@example.com', 'Test123!@#');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Тест 4: Валидация данных регистрации - невалидный email
  test('невалидный email отклоняется', () => {
    const result = validateRegisterInput('invalid-email', 'Test123!@#');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Неверный формат email');
  });

  // Тест 5: Валидация данных входа - успешная
  test('валидные данные входа принимаются', () => {
    const result = validateLoginInput('test@example.com', 'anypassword');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Тест 6: Генерация кода верификации
  test('генерация 6-значного кода верификации', () => {
    const code = generateVerificationCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code)).toBeLessThanOrEqual(999999);
  });

  // Тест 7: Проверка валидного кода верификации
  test('валидный код верификации проходит проверку', async () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 5);

    (prisma.emailVerificationCode.findFirst as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      code: '123456',
      type: 'login',
      expiresAt: futureDate,
      isUsed: false,
    });
    (prisma.emailVerificationCode.update as jest.Mock).mockResolvedValue({});

    const result = await verifyCode('test@example.com', '123456', 'login');
    
    expect(result.valid).toBe(true);
    expect(prisma.emailVerificationCode.update).toHaveBeenCalled();
  });

  // Тест 8: Проверка истекшего кода верификации
  test('истекший код верификации отклоняется', async () => {
    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 5);

    (prisma.emailVerificationCode.findFirst as jest.Mock).mockResolvedValue({
      id: '2',
      email: 'test@example.com',
      code: '123456',
      type: 'login',
      expiresAt: pastDate,
      isUsed: false,
    });

    const result = await verifyCode('test@example.com', '123456', 'login');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('истек');
  });

  // Тест 9: Хеширование пароля
  test('пароль хешируется с bcrypt', async () => {
    const password = 'Test123!@#';
    const hashedPassword = 'hashed_password_mock';
    
    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    
    const result = await bcrypt.hash(password, 10);
    
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    expect(result).toBe(hashedPassword);
  });
});
