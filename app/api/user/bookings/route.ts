import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// Создание нового бронирования
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { connectorId, startTime, duration } = await request.json();

    // Валидация входных данных
    if (!connectorId || !startTime || !duration) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    // Проверяем существование коннектора
    const connector = await prisma.connector.findUnique({
      where: { id: connectorId },
      include: {
        station: true
      }
    });

    if (!connector) {
      return NextResponse.json(
        { error: 'Коннектор не найден' },
        { status: 404 }
      );
    }

    // Проверяем статус коннектора
    if (connector.status !== 'available') {
      return NextResponse.json(
        { error: 'Коннектор недоступен для бронирования' },
        { status: 400 }
      );
    }

    // Получаем баланс пользователя
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });

    const depositAmount = 100; // Депозит 100 сом

    if (!userBalance || Number(userBalance.balance) < depositAmount) {
      return NextResponse.json(
        { error: 'Недостаточно средств для депозита' },
        { status: 400 }
      );
    }

    // Рассчитываем время окончания и дедлайн отмены
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    const cancelDeadline = new Date(start.getTime() - 30 * 60 * 1000); // За 30 минут до начала

    // Проверяем, нет ли пересечений с существующими бронированиями
    const existingBooking = await prisma.booking.findFirst({
      where: {
        connectorId,
        status: 'active',
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Выбранное время уже забронировано' },
        { status: 400 }
      );
    }

    // Создаем бронирование и списываем депозит в транзакции
    const booking = await prisma.$transaction(async (tx) => {
      // Создаем бронирование
      const newBooking = await tx.booking.create({
        data: {
          userId,
          connectorId,
          startTime: start,
          endTime: end,
          depositAmount,
          depositStatus: 'held',
          cancelDeadline,
          status: 'active'
        },
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
        }
      });

      // Списываем депозит с баланса
      await tx.userBalance.update({
        where: { userId },
        data: {
          balance: {
            decrement: depositAmount
          }
        }
      });

      // Создаем запись о платеже
      await tx.payment.create({
        data: {
          userId,
          bookingId: newBooking.id,
          amount: depositAmount,
          type: 'deposit',
          method: 'balance',
          status: 'success',
        }
      });

      return newBooking;
    });

    // Форматируем ответ
    const formattedBooking = {
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
    };

    return NextResponse.json({
      success: true,
      booking: formattedBooking,
      message: 'Бронирование успешно создано'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

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