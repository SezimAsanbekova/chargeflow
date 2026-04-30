import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET - Получить один автомобиль
export async function GET(
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

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PATCH - Обновить автомобиль
export async function PATCH(
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

    const data = await request.json();

    // Если делаем этот автомобиль активным, деактивируем остальные
    if (data.isActive === true) {
      await prisma.vehicle.updateMany({
        where: {
          userId: user.id,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    // Обновляем автомобиль
    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.brand && { brand: data.brand }),
        ...(data.model && { model: data.model }),
        ...(data.year && { year: parseInt(data.year) }),
        ...(data.connectorType && { connectorType: data.connectorType }),
        ...(data.maxPowerKw && { maxPowerKw: parseFloat(data.maxPowerKw) }),
        ...(data.batteryCapacityKwh && { batteryCapacityKwh: parseFloat(data.batteryCapacityKwh) }),
        ...(data.currentChargeLevel !== undefined && { currentChargeLevel: parseFloat(data.currentChargeLevel) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      vehicle: updatedVehicle,
      message: 'Автомобиль успешно обновлен',
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить автомобиль
export async function DELETE(
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

    // Удаляем автомобиль
    await prisma.vehicle.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Автомобиль успешно удален',
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
