import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getRegistrationEmail } from '@/lib/email';
import { validatePassword } from '@/lib/password-validator';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Валидация безопасности пароля
    const passwordValidation = validatePassword(password);
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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        role: 'user',
        status: 'active',
        emailVerified: new Date(),
        loginAttempts: 0,
      },
    });

    // Создаем баланс
    await prisma.userBalance.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });

    // Отправляем приветственное письмо
    try {
      const emailContent = getRegistrationEmail(user.name || 'Пользователь', user.email);
      await sendEmail({
        to: user.email,
        ...emailContent,
      });
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
      // Не прерываем регистрацию, если email не отправился
    }

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
