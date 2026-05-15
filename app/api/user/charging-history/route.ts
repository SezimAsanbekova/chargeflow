import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

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

    // Получаем все завершенные сессии зарядки пользователя
    const sessions = await prisma.chargingSession.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['completed', 'cancelled']
        }
      },
      include: {
        connector: {
          include: {
            station: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 50 // Последние 50 сессий
    });

    // Форматируем данные для фронтенда
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      station: {
        name: session.connector.station.name,
        address: session.connector.station.address
      },
      connector: {
        type: session.connector.type,
        powerKw: Number(session.connector.powerKw)
      },
      startTime: session.startTime.toISOString(),
      endTime: session.endTime ? session.endTime.toISOString() : null,
      energyKwh: Number(session.energyKwh),
      costTotal: Number(session.costTotal),
      status: session.status
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });

  } catch (error) {
    console.error('Get charging history error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
