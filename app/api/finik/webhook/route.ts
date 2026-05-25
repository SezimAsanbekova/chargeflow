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

    if (!isValid) {
      console.error('[Finik Webhook] Invalid signature');
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let metadata: { userId?: string; paymentId?: string; amount?: number } = {};

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
      const { userId, paymentId, amount } = metadata;
      const topUpAmount = amount ?? body.amount;

      if (!userId) {
        console.error('[Finik Webhook] Missing userId in metadata');
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.userBalance.upsert({
          where: { userId },
          update: { balance: { increment: topUpAmount } },
          create: { userId, balance: topUpAmount },
        });

        await tx.payment.create({
          data: {
            userId,
            amount: topUpAmount,
            type: 'topup',
            method: 'balance',
            status: 'success',
            transactionId: body.transactionId,
          },
        });
      });

      console.log(`[Finik Webhook] SUCCESS — userId: ${userId} | amount: ${topUpAmount} | tx: ${body.transactionId}`);
    } else if (body.status === 'FAILED' || body.status === 'failed') {
      console.error(`[Finik Webhook] FAILED — metadata:`, metadata);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Finik Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
