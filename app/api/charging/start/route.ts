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
    const { connectorId, vehicleId, bookingId, batteryStartPercent } = await request.json();

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
      },
      include: {
        connector: true
      }
    });

    if (activeSession) {
      // Если коннектор уже свободен или сессия висит > 12 часов — это зависшая сессия, закрываем её
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const isStale =
        activeSession.connector.status === 'available' ||
        activeSession.startTime < twelveHoursAgo;

      if (isStale) {
        await prisma.$transaction(async (tx) => {
          await tx.chargingSession.update({
            where: { id: activeSession.id },
            data: { status: 'completed', endTime: new Date() }
          });
          // Убеждаемся, что коннектор свободен
          await tx.connector.update({
            where: { id: activeSession.connectorId },
            data: { status: 'available' }
          });
        });
      } else {
        return NextResponse.json(
          { error: 'У вас уже есть активная сессия зарядки' },
          { status: 400 }
        );
      }
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

    const pricePerKwh = Number(connector.pricePerKwh);

    // Если есть бронирование — депозит уже был списан при бронировании, не списываем повторно
    // Получаем depositAmount из бронирования
    let depositAmount = 0;
    let existingBooking = null;
    if (bookingId) {
      existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId, userId, status: 'active' }
      });
      if (!existingBooking) {
        return NextResponse.json(
          { error: 'Бронирование не найдено или недействительно' },
          { status: 400 }
        );
      }
      depositAmount = Number(existingBooking.depositAmount);
    }

    // Минимальный баланс: для зарядки с бронированием — 50 сом (депозит уже уплачен)
    // Для зарядки без бронирования — 50 сом
    const minimumBalance = 50;
    
    if (!userBalance || Number(userBalance.balance) < minimumBalance) {
      return NextResponse.json(
        { error: `Недостаточно средств. Минимум: ${minimumBalance} сом` },
        { status: 400 }
      );
    }

    // Ищем ближайшее активное бронирование на этом коннекторе (не текущего пользователя)
    const now = new Date();
    const nextBooking = await prisma.booking.findFirst({
      where: {
        connectorId,
        status: 'active',
        startTime: { gt: now },
        userId: { not: userId },
      },
      orderBy: { startTime: 'asc' },
    });

    // Если есть ближайшее бронирование — deadline = startTime - 5 минут
    let chargingDeadline: Date | null = null;
    if (nextBooking) {
      chargingDeadline = new Date(nextBooking.startTime.getTime() - 5 * 60 * 1000);
      // Если deadline уже прошёл или меньше 1 минуты — блокируем старт
      if (chargingDeadline.getTime() - now.getTime() < 60 * 1000) {
        return NextResponse.json(
          { error: 'Коннектор скоро будет занят бронированием. Зарядка невозможна.' },
          { status: 400 }
        );
      }
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

      // Если есть бронирование — создаём запись о депозите для чека
      // НЕ снимаем баланс повторно: депозит уже был снят при создании бронирования
      if (bookingId && depositAmount > 0) {
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

      // Сохраняем начальный заряд батареи в ChargingEvent
      await tx.chargingEvent.create({
        data: {
          sessionId: newSession.id,
          eventType: 'start',
          data: { batteryStartPercent: batteryStartPercent ?? 50 },
        }
      });

      return newSession;
    });

    return NextResponse.json({
      success: true,
      session: {
        id: chargingSession.id,
        stationName: chargingSession.connector.station.name,
        stationAddress: chargingSession.connector.station.address,
        pricePerKwh: Number(connector.pricePerKwh),
        maxPowerKw: Number(connector.powerKw),
        startTime: chargingSession.startTime.toISOString(),
        depositAmount,
        status: chargingSession.status,
        chargingDeadline: chargingDeadline ? chargingDeadline.toISOString() : null,
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
