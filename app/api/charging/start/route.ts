import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

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
    const { connectorId, vehicleId, bookingId } = await request.json();

    // Валидация входных данных
    if (!connectorId) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже активной сессии у пользователя
    const activeSession = await prisma.chargingSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (activeSession) {
      return NextResponse.json(
        { error: 'У вас уже есть активная сессия зарядки' },
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
        { error: 'Коннектор недоступен' },
        { status: 400 }
      );
    }

    // Получаем баланс пользователя
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });

    const pricePerMinute = Number(connector.pricePerKwh);

    // Депозит списывается только если есть бронирование
    const depositAmount = bookingId ? 100 : 0;

    // Проверяем баланс
    // Если есть бронирование: нужен депозит + минимум 1 минута
    // Если нет бронирования: нужен только минимум для зарядки (50 сом)
    const minimumBalance = bookingId ? (depositAmount + pricePerMinute) : 50;
    
    if (!userBalance || Number(userBalance.balance) < minimumBalance) {
      return NextResponse.json(
        { error: `Недостаточно средств. Минимум: ${minimumBalance} сом` },
        { status: 400 }
      );
    }

    // Создаем сессию зарядки и списываем депозит (если есть бронирование) в транзакции
    const chargingSession = await prisma.$transaction(async (tx) => {
      // Создаем сессию зарядки
      const newSession = await tx.chargingSession.create({
        data: {
          userId,
          vehicleId: vehicleId || null, // vehicleId необязателен
          connectorId,
          bookingId: bookingId || null,
          startTime: new Date(),
          status: 'active',
          startedVia: 'app',
          energyKwh: 0,
          costTotal: 0
        },
        include: {
          connector: {
            include: {
              station: true
            }
          }
        }
      });

      // Списываем депозит с баланса ТОЛЬКО если есть бронирование
      if (bookingId && depositAmount > 0) {
        await tx.userBalance.update({
          where: { userId },
          data: {
            balance: {
              decrement: depositAmount
            }
          }
        });

        // Создаем запись о депозите
        await tx.payment.create({
          data: {
            userId,
            sessionId: newSession.id,
            amount: depositAmount,
            type: 'deposit',
            method: 'balance',
            status: 'success',
          }
        });
      }

      // Обновляем статус коннектора
      await tx.connector.update({
        where: { id: connectorId },
        data: { status: 'busy' }
      });

      // Если есть бронирование, обновляем его статус
      if (bookingId) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { 
            status: 'completed',
            depositStatus: 'lost' // Депозит идет в счет оплаты
          }
        });
      }

      return newSession;
    });

    return NextResponse.json({
      success: true,
      session: {
        id: chargingSession.id,
        stationName: chargingSession.connector.station.name,
        stationAddress: chargingSession.connector.station.address,
        pricePerMinute: Number(connector.pricePerKwh),
        maxPowerKw: Number(connector.powerKw),
        startTime: chargingSession.startTime.toISOString(),
        depositAmount,
        status: chargingSession.status
      }
    });

  } catch (error) {
    console.error('Start charging error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
