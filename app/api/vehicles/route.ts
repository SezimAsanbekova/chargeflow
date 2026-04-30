import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET - Получить все автомобили пользователя
export async function GET(request: NextRequest) {
  try {
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

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: user.id },
      orderBy: [
        { isActive: 'desc' }, // Активный автомобиль первым
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST - Добавить новый автомобиль
export async function POST(request: NextRequest) {
  try {
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

    const {
      brand,
      model,
      year,
      connectorType,
      maxPowerKw,
      batteryCapacityKwh,
      currentChargeLevel,
      isActive,
    } = await request.json();

    // Валидация
    if (!brand || !model || !year || !connectorType || !maxPowerKw || !batteryCapacityKwh) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    // Проверка типа коннектора
    const validConnectorTypes = ['CCS2', 'CHAdeMO', 'Type2', 'GB_T'];
    if (!validConnectorTypes.includes(connectorType)) {
      return NextResponse.json(
        { error: 'Неверный тип коннектора' },
        { status: 400 }
      );
    }

    // Если пользователь хочет сделать его активным, деактивируем остальные
    if (isActive === true) {
      await prisma.vehicle.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });
    }

    // Создаем автомобиль
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        brand,
        model,
        year: parseInt(year),
        connectorType,
        maxPowerKw: parseFloat(maxPowerKw),
        batteryCapacityKwh: parseFloat(batteryCapacityKwh),
        currentChargeLevel: currentChargeLevel ? parseFloat(currentChargeLevel) : 0,
        isActive: isActive === true,
      },
    });

    return NextResponse.json({
      success: true,
      vehicle,
      message: 'Автомобиль успешно добавлен',
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
