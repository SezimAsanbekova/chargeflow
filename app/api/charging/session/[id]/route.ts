import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const sessionId = params.id;

    // Получаем сессию зарядки
    const chargingSession = await prisma.chargingSession.findUnique({
      where: { id: sessionId },
      include: {
        connector: {
          include: {
            station: true
          }
        },
        payments: true,
        invoices: true
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

    // Рассчитываем время зарядки
    const endTime = chargingSession.endTime || new Date();
    const durationMs = endTime.getTime() - chargingSession.startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / 60000);

    // Получаем депозит и поминутные платежи
    const depositPayment = chargingSession.payments.find(p => p.type === 'deposit');
    const chargePayments = chargingSession.payments.filter(p => p.type === 'charge');
    const totalChargeAmount = chargePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Получаем текущий баланс
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });

    return NextResponse.json({
      session: {
        id: chargingSession.id,
        stationName: chargingSession.connector.station.name,
        stationAddress: chargingSession.connector.station.address,
        pricePerMinute: Number(chargingSession.connector.pricePerKwh),
        startTime: chargingSession.startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        energyKwh: Number(chargingSession.energyKwh),
        depositAmount: depositPayment ? Number(depositPayment.amount) : 0,
        chargeAmount: totalChargeAmount,
        totalCost: Number(chargingSession.costTotal),
        balance: userBalance ? Number(userBalance.balance) : 0,
        invoiceId: chargingSession.invoices[0]?.id || null,
        status: chargingSession.status
      }
    });

  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
