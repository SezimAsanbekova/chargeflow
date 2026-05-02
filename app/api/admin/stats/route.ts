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

    // Получаем статистику
    const [
      totalUsers,
      totalStations,
      activeBookings,
      activeSessions,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: 'user' }, // Только обычные пользователи
      }),
      prisma.station.count(),
      prisma.booking.count({
        where: { status: 'active' },
      }),
      prisma.chargingSession.count({
        where: { status: 'active' },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalStations,
      activeBookings,
      activeSessions,
    });
  } catch (error) {
    console.error('Error in admin/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
