import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/verification-code';
import { sendEmail, getLoginNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, code, type, skipMarkAsUsed } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    // Проверяем код
    const verification = await verifyCode(email, code, type || 'login', skipMarkAsUsed);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Неверный код' },
        { status: 401 }
      );
    }

    // Код правильный - получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Если это не reset_password или не skipMarkAsUsed, то сбрасываем счетчик попыток входа
    if (type !== 'reset_password' && !skipMarkAsUsed) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Отправляем уведомление о входе
      try {
        const emailContent = getLoginNotificationEmail(
          user.name || 'Пользователь',
          user.email
        );
        await sendEmail({
          to: user.email,
          ...emailContent,
        });
      } catch (emailError) {
        console.error('Failed to send login notification:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Код подтвержден',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
