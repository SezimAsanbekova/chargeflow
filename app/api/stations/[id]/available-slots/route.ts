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

    // Парсим дату в формате YYYY-MM-DD
    // Создаем начало и конец дня в UTC, учитывая часовой пояс Кыргызстана (UTC+6)
    const [year, month, day] = date.split('-').map(Number);
    
    // Начало дня: 00:00:00 по местному времени = 18:00:00 предыдущего дня UTC
    const startOfDay = new Date(Date.UTC(year, month - 1, day, -6, 0, 0, 0));
    
    // Конец дня: 23:59:59 по местному времени = 17:59:59 текущего дня UTC
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 17, 59, 59, 999));

    // Получаем текущее время
    const now = new Date();

    // Автоматически обновляем статусы просроченных бронирований для этого коннектора
    await prisma.booking.updateMany({
      where: {
        connectorId,
        status: 'active',
        endTime: {
          lt: now // Время окончания уже прошло
        }
      },
      data: {
        status: 'expired'
      }
    });

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
