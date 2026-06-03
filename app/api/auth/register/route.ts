import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/password-validator';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    console.log('📝 [REGISTER] Registration attempt:', { email, hasName: !!name, timestamp: new Date().toISOString() });

    if (!email || !password) {
      console.log('❌ [REGISTER] Missing credentials:', { email: !!email, password: !!password });
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Валидация безопасности пароля
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('❌ [REGISTER] Password validation failed:', { email, errors: passwordValidation.errors });
      return NextResponse.json(
        { 
          error: 'Пароль не соответствует требованиям безопасности',
          details: passwordValidation.errors 
        },
        { status: 400 }
      );
    }

    console.log('✅ [REGISTER] Password validation passed:', { email });

    // Проверяем существование пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ [REGISTER] User already exists:', { email });
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    console.log('✅ [REGISTER] Email available, creating user:', { email });

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

    console.log('✅ [REGISTER] User created:', { email, userId: user.id });

    // Создаем баланс
    await prisma.userBalance.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });

    console.log('✅ [REGISTER] User balance created:', { email, userId: user.id });
    console.log('🎉 [REGISTER] Registration successful:', { email, userId: user.id, name: user.name });

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
    console.error('❌ [REGISTER] Registration error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
