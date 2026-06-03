import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/verification-code';
import { sendEmail, getLoginNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, code, type, skipMarkAsUsed } = await request.json();

    console.log('🔑 [AUTH] Verify code attempt:', { email, type: type || 'login', skipMarkAsUsed, timestamp: new Date().toISOString() });

    if (!email || !code) {
      console.log('❌ [AUTH] Missing email or code:', { email: !!email, code: !!code });
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    // Проверяем код
    const verification = await verifyCode(email, code, type || 'login', skipMarkAsUsed);

    if (!verification.valid) {
      console.log('❌ [AUTH] Invalid verification code:', { email, error: verification.error });
      return NextResponse.json(
        { error: verification.error || 'Неверный код' },
        { status: 401 }
      );
    }

    console.log('✅ [AUTH] Verification code valid:', { email });

    // Код правильный - получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ [AUTH] User not found after verification:', { email });
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    console.log('✅ [AUTH] User authenticated:', { email, userId: user.id, role: user.role });

    // Проверяем, является ли пользователь администратором
    if (user.role === 'admin' && type !== 'reset_password') {
      console.log('❌ [AUTH] Admin trying to verify via user endpoint:', { email });
      return NextResponse.json(
        { error: 'Этот аккаунт предназначен только для админ-панели. Войдите через /admin/signin' },
        { status: 403 }
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

      console.log('✅ [AUTH] Login attempts reset:', { email, userId: user.id });

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
        console.log('📧 [AUTH] Login notification sent:', { email });
      } catch (emailError) {
        console.error('❌ [AUTH] Failed to send login notification:', emailError);
      }
    }

    console.log('✅ [AUTH] Login successful:', { email, userId: user.id, role: user.role });

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
    console.error('❌ [AUTH] Verify code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
