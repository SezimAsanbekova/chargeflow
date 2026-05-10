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

    // Получаем все завершенные сессии пользователя
    const sessions = await prisma.chargingSession.findMany({
      where: {
        userId,
        status: 'completed'
      },
      orderBy: {
        startTime: 'desc'
      },
      include: {
        connector: {
          include: {
            station: true
          }
        },
        invoices: true
      }
    });

    // Форматируем данные для фронтенда
    const history = sessions.map(session => {
      const endTime = session.endTime || new Date();
      const durationMs = endTime.getTime() - session.startTime.getTime();
      const durationMinutes = Math.ceil(durationMs / 60000);

      return {
        id: session.id,
        invoiceId: session.invoices[0]?.id || '',
        stationName: session.connector.station.name,
        stationAddress: session.connector.station.address,
        startTime: session.startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        energyKwh: Number(session.energyKwh),
        totalCost: Number(session.costTotal)
      };
    });

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
