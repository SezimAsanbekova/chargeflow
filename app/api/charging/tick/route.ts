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

    const pricePerMinute = Number(activeSession.connector.pricePerMinute);

    // Проверяем: если у сессии есть бронирование, депозит покрывает первые N минут
    if (activeSession.bookingId) {
      const depositPayment = await prisma.payment.findFirst({
        where: { sessionId: activeSession.id, type: 'deposit' }
      });

      if (depositPayment) {
        const depositAmount = Number(depositPayment.amount);
        const depositMinutes = Math.floor(depositAmount / pricePerMinute);

        // Считаем сколько минут уже оплачено с баланса
        const chargePaymentsCount = await prisma.payment.count({
          where: { sessionId: activeSession.id, type: 'charge' }
        });

        if (chargePaymentsCount < depositMinutes) {
          // Эта минута покрыта депозитом — обновляем только энергию
          const energyIncrement = Number(activeSession.connector.powerKw) * 0.85 / 60;
          await prisma.chargingSession.update({
            where: { id: activeSession.id },
            data: { energyKwh: { increment: energyIncrement } }
          });

          const userBalance = await prisma.userBalance.findUnique({ where: { userId } });
          const currentBalance = userBalance ? Number(userBalance.balance) : 0;
          const minutesRemaining = Math.floor(currentBalance / pricePerMinute);
          const depositMinutesLeft = depositMinutes - chargePaymentsCount - 1;

          return NextResponse.json({
            success: true,
            charged: 0,
            balance: currentBalance,
            totalCost: Number(activeSession.costTotal),
            energyKwh: Number(activeSession.energyKwh) + energyIncrement,
            minutesRemaining: minutesRemaining + depositMinutesLeft,
            depositCoveredMinute: true,
            depositMinutesLeft,
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
    if (currentBalance < pricePerMinute) {
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

    // Списываем средства за минуту
    const result = await prisma.$transaction(async (tx) => {
      // Списываем с баланса
      await tx.userBalance.update({
        where: { userId },
        data: {
          balance: {
            decrement: pricePerMinute
          }
        }
      });

      // Создаем запись о платеже
      await tx.payment.create({
        data: {
          userId,
          sessionId: activeSession.id,
          amount: pricePerMinute,
          type: 'charge',
          method: 'balance',
          status: 'success',
        }
      });

      // Обновляем общую стоимость сессии и энергию
      const energyIncrement = Number(activeSession.connector.powerKw) * 0.85 / 60; // кВт⋅ч за минуту
      
      const updatedSession = await tx.chargingSession.update({
        where: { id: activeSession.id },
        data: {
          costTotal: {
            increment: pricePerMinute
          },
          energyKwh: {
            increment: energyIncrement
          }
        }
      });

      // Получаем новый баланс
      const newBalance = await tx.userBalance.findUnique({
        where: { userId }
      });

      return {
        session: updatedSession,
        balance: newBalance ? Number(newBalance.balance) : 0
      };
    });

    const newBalance = result.balance;
    const minutesRemaining = Math.floor(newBalance / pricePerMinute);

    return NextResponse.json({
      success: true,
      charged: pricePerMinute,
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
