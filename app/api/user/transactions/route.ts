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

    // Получаем все платежи пользователя, отсортированные по дате (новые первыми)
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Ограничиваем последними 50 транзакциями
      include: {
        session: {
          include: {
            connector: {
              include: {
                station: true
              }
            }
          }
        }
      }
    });

    // Форматируем данные для фронтенда
    const transactions = payments.map(payment => {
      let description = '';
      
      switch (payment.type) {
        case 'topup':
          description = 'Пополнение баланса';
          break;
        case 'charge':
          if (payment.session?.connector?.station) {
            description = `Зарядка на станции ${payment.session.connector.station.name}`;
          } else {
            description = 'Зарядка на станции';
          }
          break;
        case 'deposit':
          description = 'Депозит за бронирование';
          break;
        case 'refund':
          description = 'Возврат средств';
          break;
        default:
          description = 'Операция';
      }

      return {
        id: payment.id,
        type: payment.type,
        amount: payment.type === 'charge' || payment.type === 'deposit' 
          ? -Number(payment.amount) 
          : Number(payment.amount),
        date: payment.createdAt.toISOString(),
        description,
        status: payment.status
      };
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
