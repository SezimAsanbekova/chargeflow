import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Простой тест без авторизации для отладки
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Проверка данных БД...');

    const [users, stations, connectors, sessions] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'user' },
        select: { id: true, name: true, email: true },
      }),
      prisma.station.findMany({
        select: { id: true, name: true, address: true },
      }),
      prisma.connector.findMany({
        select: { id: true, status: true, stationId: true },
      }),
      prisma.chargingSession.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true },
      }),
    ]);

    const stats = {
      users: {
        total: users.length,
        list: users.slice(0, 3),
      },
      stations: {
        total: stations.length,
        list: stations.slice(0, 3),
      },
      connectors: {
        total: connectors.length,
        available: connectors.filter(c => c.status === 'available').length,
        byStatus: {
          available: connectors.filter(c => c.status === 'available').length,
          busy: connectors.filter(c => c.status === 'busy').length,
          maintenance: connectors.filter(c => c.status === 'maintenance').length,
        },
      },
      sessions: {
        total: sessions.length,
        active: sessions.filter(s => s.status === 'active').length,
        recent: sessions.slice(0, 3),
      },
    };

    console.log('✅ Данные получены:', JSON.stringify(stats, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Данные успешно получены',
      data: stats,
    });
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
