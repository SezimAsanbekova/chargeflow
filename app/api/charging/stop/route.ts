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
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Отсутствует ID сессии' },
        { status: 400 }
      );
    }

    // Получаем активную сессию
    const chargingSession = await prisma.chargingSession.findUnique({
      where: { id: sessionId },
      include: {
        connector: {
          include: {
            station: true
          }
        },
        payments: true
      }
    });

    if (!chargingSession) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    if (chargingSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    if (chargingSession.status !== 'active') {
      return NextResponse.json(
        { error: 'Сессия уже завершена' },
        { status: 400 }
      );
    }

    // Завершаем сессию в транзакции
    const result = await prisma.$transaction(async (tx) => {
      const endTime = new Date();
      
      // Обновляем сессию
      const updatedSession = await tx.chargingSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          status: 'completed'
        },
        include: {
          connector: {
            include: {
              station: true
            }
          },
          payments: true
        }
      });

      // Освобождаем коннектор
      await tx.connector.update({
        where: { id: updatedSession.connectorId },
        data: { status: 'available' }
      });

      // Создаем чек
      const invoice = await tx.invoice.create({
        data: {
          userId,
          sessionId: updatedSession.id,
          totalAmount: updatedSession.costTotal,
          energyKwh: updatedSession.energyKwh
        }
      });

      // Получаем обновленный баланс
      const userBalance = await tx.userBalance.findUnique({
        where: { userId }
      });

      return {
        session: updatedSession,
        invoice,
        balance: userBalance ? Number(userBalance.balance) : 0
      };
    });

    // Рассчитываем время зарядки в минутах
    const durationMs = result.session.endTime!.getTime() - result.session.startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / 60000);

    // Получаем депозит и поминутные платежи
    const depositPayment = result.session.payments.find(p => p.type === 'deposit');
    const chargePayments = result.session.payments.filter(p => p.type === 'charge');
    const totalChargeAmount = chargePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      session: {
        id: result.session.id,
        stationName: result.session.connector.station.name,
        stationAddress: result.session.connector.station.address,
        pricePerMinute: Number(result.session.connector.pricePerMinute),
        startTime: result.session.startTime.toISOString(),
        endTime: result.session.endTime!.toISOString(),
        durationMinutes,
        energyKwh: Number(result.session.energyKwh),
        depositAmount: depositPayment ? Number(depositPayment.amount) : 0,
        chargeAmount: totalChargeAmount,
        totalCost: Number(result.session.costTotal),
        balance: result.balance,
        invoiceId: result.invoice.id
      }
    });

  } catch (error) {
    console.error('Stop charging error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
