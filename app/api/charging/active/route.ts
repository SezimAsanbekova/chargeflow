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
        payments: true,
        chargingEvents: {
          where: { eventType: 'start' },
          take: 1,
        }
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

    const pricePerKwh = Number(activeSession.connector.pricePerKwh);
    const powerKw = Number(activeSession.connector.powerKw);
    const balance = userBalance ? Number(userBalance.balance) : 0;

    // Стоимость одной минуты зарядки = цена/кВт·ч × энергия за минуту
    const energyPerMinute = powerKw * 0.85 / 60;
    const costPerMinute = pricePerKwh * energyPerMinute;

    // Сколько кВт·ч можно ещё зарядить на остаток баланса
    const kwhRemaining = pricePerKwh > 0 ? balance / pricePerKwh : 0;
    const minutesRemaining = costPerMinute > 0 ? Math.floor(balance / costPerMinute) : 0;
    const lowBalanceWarning = minutesRemaining <= 2 && minutesRemaining > 0;
    const criticalBalanceWarning = minutesRemaining === 1;

    return NextResponse.json({
      active: true,
      session: {
        id: activeSession.id,
        stationName: activeSession.connector.station.name,
        stationAddress: activeSession.connector.station.address,
        pricePerKwh,
        maxPowerKw: powerKw,
        startTime: activeSession.startTime.toISOString(),
        durationMinutes,
        energyKwh: Number(activeSession.energyKwh),
        currentPowerKw: powerKw * 0.85,
        batteryPercent: Math.min(99, (((activeSession.chargingEvents[0]?.data as any)?.batteryStartPercent) ?? 50) + Math.floor(durationMinutes * 0.5)),
        depositAmount: depositPayment ? Number(depositPayment.amount) : 0,
        chargeAmount: totalChargeAmount,
        totalCost: Number(activeSession.costTotal),
        balance,
        kwhRemaining: Math.round(kwhRemaining * 100) / 100,
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
