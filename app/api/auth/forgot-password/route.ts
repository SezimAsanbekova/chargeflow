import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode } from '@/lib/verification-code';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Из соображений безопасности всегда возвращаем успех,
    // даже если пользователь не найден (чтобы не раскрывать существующие email)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Если аккаунт с таким email существует, код был отправлен',
      });
    }

    // Отправляем код
    const result = await sendVerificationCode(email, 'reset_password');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Не удалось отправить код' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Код для сброса пароля отправлен на ваш email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
