import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminVerificationCode } from '@/lib/telegram';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Admin login attempt:', { email });

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь с таким email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', { email, role: user.role, hasPassword: !!user.passwordHash });

    // Проверяем, является ли пользователь администратором
    if (user.role !== 'admin') {
      console.log('❌ User is not admin:', { email, role: user.role });
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 403 }
      );
    }

    // Проверяем пароль
    if (!user.passwordHash) {
      console.log('❌ Password not set for user:', email);
      return NextResponse.json(
        { error: 'Password not set for this user. Please set a password first.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 403 }
      );
    }

    console.log('✅ Password valid, sending verification code...');

    // Отправляем код верификации
    const result = await sendAdminVerificationCode(email);

    if (!result.success) {
      console.error('❌ Failed to send verification code:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 500 }
      );
    }

    console.log('✅ Verification code sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to Telegram',
    });
  } catch (error) {
    console.error('❌ Error in admin send-code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
