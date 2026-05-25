import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { createFinikPayment } from '@/lib/finik';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Некорректная сумма' }, { status: 400 });
    }

    const paymentId = crypto.randomUUID();

    const paymentUrl = await createFinikPayment({ amount, userId, paymentId });

    // Сохраняем pending-платёж — завершается через redirect или webhook
    await prisma.payment.create({
      data: {
        userId,
        amount,
        type: 'topup',
        method: 'finik',
        status: 'pending',
        transactionId: paymentId,
      },
    });

    return NextResponse.json({ success: true, paymentUrl, amount, paymentId });
  } catch (error) {
    console.error('Error creating Finik payment:', error);
    return NextResponse.json(
      {
        error: 'Ошибка создания платежа',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
