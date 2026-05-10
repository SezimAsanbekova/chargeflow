import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Получаем все автомобили пользователя
    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      vehicles: vehicles.map(v => ({
        id: v.id,
        make: v.brand,
        model: v.model,
        year: v.year,
        batteryCapacityKwh: Number(v.batteryCapacityKwh),
        connectorType: v.connectorType
      }))
    });

  } catch (error) {
    console.error('Get vehicles error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
