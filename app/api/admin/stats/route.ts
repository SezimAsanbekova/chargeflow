import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(adminToken);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Получаем статистику - УПРОЩЕННАЯ ВЕРСИЯ
    console.log('📊 Получаем статистику...');
    
    const totalUsers = await prisma.user.count({
      where: { role: 'user' },
    });
    console.log('👥 Пользователей:', totalUsers);
    
    const totalStations = await prisma.station.count();
    console.log('🔌 Станций:', totalStations);
    
    const activeSessions = await prisma.chargingSession.count({
      where: { status: 'active' },
    });
    console.log('⚡ Активных сессий:', activeSessions);
    
    const availableConnectors = await prisma.connector.count({
      where: { status: 'available' },
    });
    console.log('🟢 Свободных коннекторов:', availableConnectors);
    
    // Последняя активность - упрощенная версия
    const recentSessions = await prisma.chargingSession.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        connector: {
          include: {
            station: { select: { name: true } },
          },
        },
      },
    });
    
    const recentActivity = recentSessions.map(session => ({
      type: 'session',
      id: session.id,
      timestamp: session.createdAt,
      status: session.status,
      user_name: session.user.name,
      station_name: session.connector.station.name,
      start_time: session.startTime,
      end_time: session.endTime,
    }));
    
    console.log('📋 Активность:', recentActivity.length, 'событий');
    
    // Статистика по дням - упрощенная
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const allSessions = await prisma.chargingSession.findMany({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
      select: {
        createdAt: true,
      },
    });
    
    console.log('📊 Зарядок за 30 дней:', allSessions.length);
    
    // Форматируем данные по дням
    const dailyData: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = allSessions.filter(s => {
        const sessionDate = new Date(s.createdAt).toISOString().split('T')[0];
        return sessionDate === dateStr;
      }).length;
      
      dailyData.push({ date: dateStr, count });
    }

    const response = {
      totalUsers,
      totalStations,
      activeSessions,
      availableConnectors,
      recentActivity,
      dailyData,
    };
    
    console.log('✅ Отправляем ответ:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error in admin/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
