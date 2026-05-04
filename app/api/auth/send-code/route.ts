import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode } from '@/lib/verification-code';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, type } = await request.json();

    if (!email || !password) {
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
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Проверяем, является ли пользователь администратором
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Этот аккаунт предназначен только для админ-панели. Войдите через /admin/signin' },
        { status: 403 }
      );
    }

    // Проверка блокировки аккаунта
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Аккаунт заблокирован. Попробуйте через ${minutesLeft} минут` },
        { status: 403 }
      );
    }

    // Проверка статуса
    if (user.status === 'blocked') {
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

    // Пароль правильный - отправляем код
    const result = await sendVerificationCode(email, type || 'login');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Не удалось отправить код' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Код отправлен на ваш email',
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
