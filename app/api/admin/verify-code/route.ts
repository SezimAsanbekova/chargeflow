import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminCode } from '@/lib/telegram';
import { signJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Проверяем код
    const result = await verifyAdminCode(email, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid code' },
        { status: 400 }
      );
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'User not found or not an admin' },
        { status: 403 }
      );
    }

    // Генерируем JWT токен для админа
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'admin',
    });

    // Создаем response с токеном в cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Устанавливаем cookie с токеном
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in admin verify-code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
