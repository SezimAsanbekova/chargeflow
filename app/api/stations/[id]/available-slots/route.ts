import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const connectorId = searchParams.get('connectorId');

    if (!date || !connectorId) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      );
    }

    // Получаем начало и конец дня для выбранной даты
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Получаем все активные бронирования для этого коннектора на выбранную дату
    const bookings = await prisma.booking.findMany({
      where: {
        connectorId,
        status: 'active',
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Преобразуем бронирования в массив занятых временных слотов
    const bookedSlots = bookings.map(booking => ({
      start: booking.startTime.toISOString(),
      end: booking.endTime.toISOString()
    }));

    return NextResponse.json({
      date,
      connectorId,
      bookedSlots
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
