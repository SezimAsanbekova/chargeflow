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
    const invoiceId = params.id;

    // Получаем чек
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        session: {
          include: {
            connector: {
              include: {
                station: true
              }
            },
            payments: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Чек не найден' },
        { status: 404 }
      );
    }

    if (invoice.userId !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Рассчитываем время зарядки
    const endTime = invoice.session.endTime || new Date();
    const durationMs = endTime.getTime() - invoice.session.startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / 60000);

    // Получаем депозит и поминутные платежи
    const depositPayment = invoice.session.payments.find(p => p.type === 'deposit');
    const chargePayments = invoice.session.payments.filter(p => p.type === 'charge');
    const totalChargeAmount = chargePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Вычисляем общую стоимость из платежей
    const totalCost = totalChargeAmount + (depositPayment ? Number(depositPayment.amount) : 0);

    return NextResponse.json({
      receipt: {
        invoiceId: invoice.id,
        sessionId: invoice.sessionId,
        stationName: invoice.session.connector.station.name,
        stationAddress: invoice.session.connector.station.address,
        pricePerMinute: Number(invoice.session.connector.pricePerMinute),
        startTime: invoice.session.startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        energyKwh: Number(invoice.session.energyKwh),
        depositAmount: depositPayment ? Number(depositPayment.amount) : 0,
        chargeAmount: totalChargeAmount,
        totalCost: totalCost
      }
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
