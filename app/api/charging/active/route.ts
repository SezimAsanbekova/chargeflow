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

    // Получаем активную сессию пользователя
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
        },
        payments: true
      }
    });

    if (!activeSession) {
      return NextResponse.json({
        active: false,
        session: null
      });
    }

    // Рассчитываем текущее время зарядки
    const now = new Date();
    const durationMs = now.getTime() - activeSession.startTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    // Получаем депозит и поминутные платежи
    const depositPayment = activeSession.payments.find(p => p.type === 'deposit');
    const chargePayments = activeSession.payments.filter(p => p.type === 'charge');
    const totalChargeAmount = chargePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Получаем текущий баланс
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });

    const pricePerMinute = Number(activeSession.connector.pricePerKwh);
    const balance = userBalance ? Number(userBalance.balance) : 0;

    // Проверяем, достаточно ли средств
    const minutesRemaining = Math.floor(balance / pricePerMinute);
    const lowBalanceWarning = minutesRemaining <= 2 && minutesRemaining > 0;
    const criticalBalanceWarning = minutesRemaining === 1;

    return NextResponse.json({
      active: true,
      session: {
        id: activeSession.id,
        stationName: activeSession.connector.station.name,
        stationAddress: activeSession.connector.station.address,
        pricePerMinute,
        maxPowerKw: Number(activeSession.connector.powerKw),
        startTime: activeSession.startTime.toISOString(),
        durationMinutes,
        energyKwh: Number(activeSession.energyKwh),
        currentPowerKw: Number(activeSession.connector.powerKw) * 0.85, // Симуляция текущей мощности
        batteryPercent: Math.min(95, 20 + Math.floor(durationMinutes * 0.5)), // Симуляция процента заряда
        depositAmount: depositPayment ? Number(depositPayment.amount) : 0,
        chargeAmount: totalChargeAmount,
        totalCost: Number(activeSession.costTotal),
        balance,
        minutesRemaining,
        lowBalanceWarning,
        criticalBalanceWarning
      }
    });

  } catch (error) {
    console.error('Get active session error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
