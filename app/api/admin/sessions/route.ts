import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, что пользователь - администратор
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем параметры фильтрации
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const stationId = searchParams.get('stationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Строим условия фильтрации
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (stationId) {
      where.connector = {
        stationId: stationId,
      };
    }

    // Получаем все зарядные сессии с информацией о коннекторе, станции и пользователе
    const chargingSessions = await prisma.chargingSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
          },
        },
        connector: {
          include: {
            station: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            connectorType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
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
      user: {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        name: session.user.name,
      },
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
        pricePerKwh: Number(session.connector.pricePerKwh),
      },
      vehicle: session.vehicle ? {
        brand: session.vehicle.brand,
        model: session.vehicle.model,
        connectorType: session.vehicle.connectorType,
      } : null,
      createdAt: session.createdAt,
    }));

    // Статистика
    const stats = {
      total: chargingSessions.length,
      active: chargingSessions.filter((s) => s.status === 'active').length,
      completed: chargingSessions.filter((s) => s.status === 'completed').length,
      cancelled: chargingSessions.filter((s) => s.status === 'cancelled').length,
      totalRevenue: chargingSessions
        .filter((s) => s.status === 'completed')
        .reduce((sum, s) => sum + Number(s.costTotal), 0),
      totalEnergy: chargingSessions
        .filter((s) => s.status === 'completed')
        .reduce((sum, s) => sum + Number(s.energyKwh), 0),
    };

    return NextResponse.json({
      sessions: formattedSessions,
      stats,
    });
  } catch (error) {
    console.error('Error fetching charging sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charging sessions' },
      { status: 500 }
    );
  }
}
