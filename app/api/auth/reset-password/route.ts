import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/verification-code';
import { validatePassword } from '@/lib/password-validator';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, код и новый пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверяем код
    const verification = await verifyCode(email, code, 'reset_password');

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Неверный код' },
        { status: 401 }
      );
    }

    // Валидация нового пароля
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Пароль не соответствует требованиям безопасности',
          details: passwordValidation.errors 
        },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль и сбрасываем блокировку
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменен',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
