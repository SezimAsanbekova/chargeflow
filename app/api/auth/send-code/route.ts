import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode } from '@/lib/verification-code';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, type } = await request.json();

    console.log('🔐 [AUTH] Login attempt:', { email, type: type || 'login', timestamp: new Date().toISOString() });

    if (!email || !password) {
      console.log('❌ [AUTH] Missing credentials:', { email: !!email, password: !!password });
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      console.log('❌ [AUTH] User not found or no password:', { email, exists: !!user, hasPassword: !!user?.passwordHash });
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    console.log('✅ [AUTH] User found:', { email, role: user.role, status: user.status, loginAttempts: user.loginAttempts });

    // Проверяем, является ли пользователь администратором
    if (user.role === 'admin') {
      console.log('❌ [AUTH] Admin trying to login via user endpoint:', { email });
      return NextResponse.json(
        { error: 'Этот аккаунт предназначен только для админ-панели. Войдите через /admin/signin' },
        { status: 403 }
      );
    }

    // Проверка блокировки аккаунта
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      console.log('🔒 [AUTH] Account locked:', { email, minutesLeft, lockedUntil: user.lockedUntil });
      return NextResponse.json(
        { error: `Аккаунт заблокирован. Попробуйте через ${minutesLeft} минут` },
        { status: 403 }
      );
    }

    // Проверка статуса
    if (user.status === 'blocked') {
      console.log('🚫 [AUTH] Account blocked by admin:', { email });
      return NextResponse.json(
        { error: 'Ваш аккаунт заблокирован администратором' },
        { status: 403 }
      );
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Увеличиваем счетчик неудачных попыток
      const newAttempts = user.loginAttempts + 1;
      console.log('❌ [AUTH] Invalid password:', { email, attempts: newAttempts, maxAttempts: 5 });
      
      const updateData: any = {
        loginAttempts: newAttempts,
      };

      // Блокируем на 1 час после 5 неудачных попыток
      if (newAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setHours(lockUntil.getHours() + 1);
        updateData.lockedUntil = lockUntil;
        
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        console.log('🔒 [AUTH] Account locked due to failed attempts:', { email, lockedUntil: lockUntil });
        return NextResponse.json(
          { error: 'Слишком много неудачных попыток входа. Аккаунт заблокирован на 1 час' },
          { status: 403 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      const attemptsLeft = 5 - newAttempts;
      return NextResponse.json(
        { error: `Неверный пароль. Осталось попыток: ${attemptsLeft}` },
        { status: 401 }
      );
    }

    console.log('✅ [AUTH] Password valid, sending verification code:', { email });

    // Пароль правильный - отправляем код
    const result = await sendVerificationCode(email, type || 'login');

    if (!result.success) {
      console.log('❌ [AUTH] Failed to send verification code:', { email, error: result.error });
      return NextResponse.json(
        { error: result.error || 'Не удалось отправить код' },
        { status: 500 }
      );
    }

    console.log('✅ [AUTH] Verification code sent successfully:', { email, type: type || 'login' });

    return NextResponse.json({
      success: true,
      message: 'Код отправлен на ваш email',
    });
  } catch (error) {
    console.error('❌ [AUTH] Send code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
