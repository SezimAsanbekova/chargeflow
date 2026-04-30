import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// POST - Сделать автомобиль активным
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Автомобиль не найден' },
        { status: 404 }
      );
    }

    // Деактивируем все автомобили пользователя
    await prisma.vehicle.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    // Активируем выбранный автомобиль
    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      vehicle: updatedVehicle,
      message: 'Автомобиль установлен как активный',
    });
  } catch (error) {
    console.error('Set active vehicle error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
