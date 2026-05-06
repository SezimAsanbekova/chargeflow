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

    // Получаем все бронирования пользователя с информацией о станции и коннекторе
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        connector: {
          include: {
            station: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Преобразуем данные в нужный формат для фронтенда
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      station: {
        id: booking.connector.station.id,
        name: booking.connector.station.name,
        address: booking.connector.station.address,
        latitude: Number(booking.connector.station.latitude),
        longitude: Number(booking.connector.station.longitude),
      },
      connector: {
        id: booking.connector.id,
        type: booking.connector.type,
        powerKw: Number(booking.connector.powerKw),
        pricePerKwh: Number(booking.connector.pricePerKwh),
      },
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      depositAmount: Number(booking.depositAmount),
      depositStatus: booking.depositStatus,
      cancelDeadline: booking.cancelDeadline.toISOString(),
      createdAt: booking.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Отмена бронирования
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { bookingId, action } = await request.json();

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: 'Неподдерживаемое действие' },
        { status: 400 }
      );
    }

    // Проверяем, что бронирование принадлежит пользователю
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId,
        status: 'active'
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Бронирование не найдено или уже отменено' },
        { status: 404 }
      );
    }

    // Проверяем, можно ли отменить бронирование (за 30+ минут до начала)
    const now = new Date();
    const timeDiff = booking.startTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff <= 30) {
      return NextResponse.json(
        { error: 'Отмена возможна не позднее чем за 30 минут до начала' },
        { status: 400 }
      );
    }

    // Отменяем бронирование и возвращаем депозит
    await prisma.$transaction(async (tx) => {
      // Обновляем статус бронирования
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          depositStatus: 'returned'
        }
      });

      // Возвращаем депозит на баланс пользователя
      await tx.userBalance.upsert({
        where: { userId },
        update: {
          balance: {
            increment: booking.depositAmount
          }
        },
        create: {
          userId,
          balance: booking.depositAmount
        }
      });

      // Создаем запись о возврате депозита
      await tx.payment.create({
        data: {
          userId,
          bookingId,
          amount: booking.depositAmount,
          type: 'refund',
          method: 'balance',
          status: 'success',
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Бронирование отменено, депозит возвращен' 
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}