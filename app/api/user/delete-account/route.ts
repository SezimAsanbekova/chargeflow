import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Пароль обязателен для подтверждения' },
        { status: 400 }
      );
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем пароль (если пользователь зарегистрирован через email)
    if (user.passwordHash) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Неверный пароль' },
          { status: 401 }
        );
      }
    }

    // Удаляем все связанные данные пользователя
    // Prisma автоматически удалит связанные записи благодаря onDelete: Cascade
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Аккаунт успешно удален',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
