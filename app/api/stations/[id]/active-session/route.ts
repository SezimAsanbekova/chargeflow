import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stationId } = await params;

    // Найти активную зарядную сессию на любом коннекторе этой станции
    const activeSession = await prisma.chargingSession.findFirst({
      where: {
        status: 'active',
        connector: {
          stationId,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
        booking: {
          select: { endTime: true },
        },
      },
    });

    if (!activeSession) {
      return NextResponse.json({ active: false });
    }

    // Время освобождения: из бронирования (если есть), иначе null
    const estimatedEndTime = activeSession.booking?.endTime?.toISOString() ?? null;

    return NextResponse.json({
      active: true,
      driverName: activeSession.user?.name ?? null,
      estimatedEndTime,
      startTime: activeSession.startTime.toISOString(),
    });
  } catch (error) {
    console.error('Active session error:', error);
    return NextResponse.json({ active: false });
  }
}
