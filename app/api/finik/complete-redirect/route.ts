import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/finik/complete-redirect
 * Вызывается когда пользователь возвращается после оплаты Finik.
 * Находит pending-платёж и пополняет баланс (если webhook не успел).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Нет paymentId' }, { status: 400 });
    }

    // Ищем платёж текущего пользователя
    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        transactionId: paymentId,
        method: 'finik',
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Платёж не найден' }, { status: 404 });
    }

    // Если уже обработан (webhook успел раньше) — просто возвращаем баланс
    if (payment.status === 'success') {
      const balance = await prisma.userBalance.findUnique({ where: { userId } });
      return NextResponse.json({
        success: true,
        alreadyCredited: true,
        balance: Number(balance?.balance ?? 0),
      });
    }

    // Пополняем баланс и помечаем платёж завершённым
    const [, updatedBalance] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'success' },
      }),
      prisma.userBalance.upsert({
        where: { userId },
        update: { balance: { increment: Number(payment.amount) } },
        create: { userId, balance: Number(payment.amount) },
      }),
    ]);

    console.log(`[Finik Redirect] Credited ${payment.amount} сом → userId: ${userId}`);

    return NextResponse.json({
      success: true,
      credited: true,
      amount: Number(payment.amount),
      balance: Number(updatedBalance.balance),
    });
  } catch (error) {
    console.error('[Finik Redirect] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка обработки платежа', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
