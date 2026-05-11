import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Получаем историю зарядок с информацией о коннекторе и станции
    const chargingSessions = await prisma.chargingSession.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['completed', 'cancelled'],
        },
      },
      include: {
        connector: {
          include: {
            station: true,
          },
        },
        vehicle: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Последние 50 сессий
    });

    // Форматируем данные для фронтенда
    const formattedSessions = chargingSessions.map((session) => ({
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      energyKwh: Number(session.energyKwh),
      costTotal: Number(session.costTotal),
      status: session.status,
      startedVia: session.startedVia,
      station: {
        id: session.connector.station.id,
        name: session.connector.station.name,
        address: session.connector.station.address,
      },
      connector: {
        id: session.connector.id,
        type: session.connector.type,
        powerKw: Number(session.connector.powerKw),
        pricePerMinute: Number(session.connector.pricePerMinute),
      },
      vehicle: session.vehicle ? {
        brand: session.vehicle.brand,
        model: session.vehicle.model,
      } : null,
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error('Error fetching charging history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charging history' },
      { status: 500 }
    );
  }
}
