import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// Этот endpoint вызывается каждую минуту для списания средств
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

    // Получаем активную сессию
    const activeSession = await prisma.chargingSession.findFirst({
      where: {
        userId,
        status: 'active'
      },
      include: {
        connector: {
          include: {
            station: true
          }
        }
      }
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: 'Нет активной сессии' },
        { status: 404 }
      );
    }

    const pricePerKwh = Number(activeSession.connector.pricePerKwh);
    const powerKw = Number(activeSession.connector.powerKw);
    const energyIncrement = powerKw * 0.85 / 60; // кВт·ч за одну минуту
    const costPerTick = pricePerKwh * energyIncrement; // стоимость одной минуты зарядки

    // Проверяем: если у сессии есть бронирование, депозит покрывает первые N тиков
    if (activeSession.bookingId) {
      const depositPayment = await prisma.payment.findFirst({
        where: { sessionId: activeSession.id, type: 'deposit' }
      });

      if (depositPayment) {
        const depositAmount = Number(depositPayment.amount);
        const depositTicks = costPerTick > 0 ? Math.floor(depositAmount / costPerTick) : 0;

        const chargePaymentsCount = await prisma.payment.count({
          where: { sessionId: activeSession.id, type: 'charge' }
        });

        if (chargePaymentsCount < depositTicks) {
          // Эта минута покрыта депозитом — обновляем только энергию
          await prisma.chargingSession.update({
            where: { id: activeSession.id },
            data: { energyKwh: { increment: energyIncrement } }
          });

          const userBalance = await prisma.userBalance.findUnique({ where: { userId } });
          const currentBalance = userBalance ? Number(userBalance.balance) : 0;
          const minutesRemaining = costPerTick > 0 ? Math.floor(currentBalance / costPerTick) : 0;
          const depositTicksLeft = depositTicks - chargePaymentsCount - 1;

          return NextResponse.json({
            success: true,
            charged: 0,
            balance: currentBalance,
            totalCost: Number(activeSession.costTotal),
            energyKwh: Number(activeSession.energyKwh) + energyIncrement,
            minutesRemaining: minutesRemaining + depositTicksLeft,
            depositCoveredMinute: true,
            depositMinutesLeft: depositTicksLeft,
          });
        }
      }
    }

    // Проверяем дедлайн бронирования (5 минут до следующего бронирования)
    const nowForDeadline = new Date();
    const nextBooking = await prisma.booking.findFirst({
      where: {
        connectorId: activeSession.connectorId,
        status: 'active',
        startTime: { gt: nowForDeadline },
        userId: { not: userId },
      },
      orderBy: { startTime: 'asc' },
    });

    if (nextBooking) {
      const deadline = new Date(nextBooking.startTime.getTime() - 5 * 60 * 1000);
      if (nowForDeadline >= deadline) {
        // Автоматически останавливаем зарядку из-за бронирования
        const stopResult = await prisma.$transaction(async (tx) => {
          const endTime = new Date();
          const updatedSession = await tx.chargingSession.update({
            where: { id: activeSession.id },
            data: { endTime, status: 'completed' }
          });
          await tx.connector.update({
            where: { id: activeSession.connectorId },
            data: { status: 'available' }
          });
          await tx.invoice.create({
            data: {
              userId,
              sessionId: updatedSession.id,
              totalAmount: updatedSession.costTotal,
              energyKwh: updatedSession.energyKwh
            }
          });
          return updatedSession;
        });
        const durationMs = stopResult.endTime!.getTime() - stopResult.startTime.getTime();
        const durationMinutes = Math.ceil(durationMs / 60000);
        return NextResponse.json({
          stopped: true,
          reason: 'booking_deadline',
          session: {
            id: stopResult.id,
            stationName: activeSession.connector.station.name,
            durationMinutes,
            energyKwh: Number(stopResult.energyKwh),
            totalCost: Number(stopResult.costTotal),
          }
        });
      }
    }

    // Получаем баланс пользователя
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });

    const currentBalance = userBalance ? Number(userBalance.balance) : 0;

    // Проверяем, достаточно ли средств для списания
    if (currentBalance < costPerTick) {
      // Недостаточно средств - автоматически останавливаем зарядку
      const result = await prisma.$transaction(async (tx) => {
        const endTime = new Date();
        
        // Обновляем сессию
        const updatedSession = await tx.chargingSession.update({
          where: { id: activeSession.id },
          data: {
            endTime,
            status: 'completed'
          }
        });

        // Освобождаем коннектор
        await tx.connector.update({
          where: { id: activeSession.connectorId },
          data: { status: 'available' }
        });

        // Создаем чек
        await tx.invoice.create({
          data: {
            userId,
            sessionId: updatedSession.id,
            totalAmount: updatedSession.costTotal,
            energyKwh: updatedSession.energyKwh
          }
        });

        return updatedSession;
      });

      // Рассчитываем время зарядки
      const durationMs = result.endTime!.getTime() - result.startTime.getTime();
      const durationMinutes = Math.ceil(durationMs / 60000);

      return NextResponse.json({
        stopped: true,
        reason: 'insufficient_funds',
        session: {
          id: result.id,
          stationName: activeSession.connector.station.name,
          durationMinutes,
          energyKwh: Number(result.energyKwh),
          totalCost: Number(result.costTotal),
          balance: 0
        }
      });
    }

    // Списываем средства за минуту (по кВт·ч)
    const result = await prisma.$transaction(async (tx) => {
      await tx.userBalance.update({
        where: { userId },
        data: { balance: { decrement: costPerTick } }
      });

      await tx.payment.create({
        data: {
          userId,
          sessionId: activeSession.id,
          amount: costPerTick,
          type: 'charge',
          method: 'balance',
          status: 'success',
        }
      });

      const updatedSession = await tx.chargingSession.update({
        where: { id: activeSession.id },
        data: {
          costTotal: { increment: costPerTick },
          energyKwh: { increment: energyIncrement }
        }
      });

      const newBalance = await tx.userBalance.findUnique({ where: { userId } });

      return {
        session: updatedSession,
        balance: newBalance ? Number(newBalance.balance) : 0
      };
    });

    const newBalance = result.balance;
    const minutesRemaining = costPerTick > 0 ? Math.floor(newBalance / costPerTick) : 0;

    return NextResponse.json({
      success: true,
      charged: costPerTick,
      balance: newBalance,
      totalCost: Number(result.session.costTotal),
      energyKwh: Number(result.session.energyKwh),
      minutesRemaining,
      lowBalanceWarning: minutesRemaining <= 2 && minutesRemaining > 0,
      criticalBalanceWarning: minutesRemaining === 1
    });

  } catch (error) {
    console.error('Charging tick error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
