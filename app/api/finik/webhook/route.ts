import { NextRequest, NextResponse } from 'next/server';
import { verifyFinikWebhook, isTimestampValid, FinikWebhookData } from '@/lib/finik';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('signature');
    const timestamp = request.headers.get('x-api-timestamp');
    const host = request.headers.get('host');

    if (!signature || !timestamp) {
      console.error('[Finik Webhook] Missing signature or timestamp');
      return NextResponse.json({ error: 'Missing signature or timestamp' }, { status: 400 });
    }

    if (!isTimestampValid(timestamp)) {
      console.error('[Finik Webhook] Timestamp too old');
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 });
    }

    const body: FinikWebhookData = await request.json();

    const headers: Record<string, string> = { 'host': host || '' };

    const isValid = await verifyFinikWebhook(
      signature,
      timestamp,
      body as any,
      headers,
      '/api/finik/webhook'
    );

    // Подпись проверяется во ВСЕХ окружениях. Невалидная подпись => отказ,
    // иначе кто угодно может зачислить себе баланс поддельным запросом.
    if (!isValid) {
      console.error('[Finik Webhook] Invalid signature — rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let metadata: { userId?: string; paymentId?: string } = {};

    try {
      if (body.data?.metadata) {
        if (typeof body.data.metadata === 'string') {
          metadata = JSON.parse(body.data.metadata);
        } else {
          metadata = body.data.metadata as typeof metadata;
        }
      }
    } catch (e) {
      console.error('[Finik Webhook] Error parsing metadata:', e);
    }

    if (body.status === 'SUCCEEDED' || body.status === 'succeeded') {
      const { paymentId } = metadata;

      if (!paymentId) {
        console.error('[Finik Webhook] Missing paymentId in metadata');
        return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
      }

      // Находим заранее созданный pending-платёж. Сумму и userId берём ИЗ БД,
      // а не из клиентских metadata — их нельзя подделать на стороне клиента.
      const payment = await prisma.payment.findFirst({
        where: { transactionId: paymentId, type: 'topup', method: 'finik' },
      });

      if (!payment) {
        console.error('[Finik Webhook] Unknown paymentId:', paymentId);
        return NextResponse.json({ error: 'Unknown payment' }, { status: 404 });
      }

      // Идемпотентность: если платёж уже обработан — выходим без повторного зачисления.
      if (payment.status === 'success') {
        console.log('[Finik Webhook] Already processed, skipping:', paymentId);
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }

      const topUpAmount = payment.amount; // Decimal, доверенная сумма из БД
      const userId = payment.userId;

      await prisma.$transaction(async (tx) => {
        // Атомарный перевод pending -> success: только одна из конкурентных
        // доставок вебхука пройдёт этот guard и зачислит баланс.
        const updated = await tx.payment.updateMany({
          where: { id: payment.id, status: 'pending' },
          data: { status: 'success' },
        });

        if (updated.count === 0) {
          // Кто-то уже обработал между чтением и записью — ничего не зачисляем.
          return;
        }

        await tx.userBalance.upsert({
          where: { userId },
          update: { balance: { increment: topUpAmount } },
          create: { userId, balance: topUpAmount },
        });
      });

      console.log(`[Finik Webhook] SUCCESS — userId: ${userId} | amount: ${topUpAmount} | tx: ${body.transactionId}`);
    } else if (body.status === 'FAILED' || body.status === 'failed') {
      const { paymentId } = metadata;
      if (paymentId) {
        await prisma.payment.updateMany({
          where: { transactionId: paymentId, status: 'pending' },
          data: { status: 'failed' },
        });
      }
      console.error('[Finik Webhook] FAILED — paymentId:', paymentId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Finik Webhook] Error:', error);
    // Не раскрываем детали ошибки клиенту.
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
