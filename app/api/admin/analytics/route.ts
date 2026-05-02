import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get period from query
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const customDate = searchParams.get('date');

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'all':
        // Get all data from the beginning
        startDate = new Date('2020-01-01'); // Начало времен
        break;
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        if (customDate) {
          startDate = new Date(customDate);
          startDate.setHours(0, 0, 0, 0);
        }
        break;
    }

    // Get sessions in date range
    console.log('Fetching sessions from:', startDate, 'to:', now);
    
    const sessions = await prisma.chargingSession.findMany({
      where: {
        startTime: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        energyKwh: true,
        costTotal: true,
        userId: true,
      },
    });

    console.log('Found sessions:', sessions.length);
    
    // Also get all sessions to check if there are any
    const allSessions = await prisma.chargingSession.count();
    console.log('Total sessions in database:', allSessions);

    // Get total counts (not filtered by date)
    const [totalUsersCount, totalStationsCount] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.station.count(),
    ]);

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalEnergy = sessions.reduce((sum, s) => sum + Number(s.energyKwh), 0);
    const totalRevenue = sessions.reduce((sum, s) => sum + Number(s.costTotal), 0);
    
    // Get unique users count in period
    const uniqueUsersInPeriod = new Set(sessions.map(s => s.userId)).size;

    // Calculate average session time
    const completedSessions = sessions.filter(s => s.endTime);
    const totalMinutes = completedSessions.reduce((sum, s) => {
      if (s.endTime) {
        const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        return sum + duration / 60000; // Convert to minutes
      }
      return sum;
    }, 0);
    const averageSessionTime = completedSessions.length > 0 
      ? Math.round(totalMinutes / completedSessions.length) 
      : 0;

    return NextResponse.json({
      totalSessions,
      totalEnergy,
      totalRevenue,
      totalUsers: uniqueUsersInPeriod,
      totalUsersCount, // Всего пользователей в системе
      totalStationsCount, // Всего станций в системе
      averageSessionTime,
      sessionsPerDay: [], // Can be implemented later for charts
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
