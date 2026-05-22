import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Получаем все платежи пользователя, отсортированные по дате (новые первыми)
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        session: {
          include: {
            connector: {
              include: {
                station: true,
              },
            },
          },
        },
      },
    });

    // Группируем charge-платежи по sessionId — одна строка = одна сессия
    const chargeBySession = new Map<string, {
      totalAmount: number;
      date: string;
      stationName: string | null;
      sessionId: string;
    }>();

    const nonChargePayments: typeof payments = [];

    for (const payment of payments) {
      if (payment.type === "charge" && payment.sessionId) {
        const existing = chargeBySession.get(payment.sessionId);
        if (existing) {
          existing.totalAmount += Number(payment.amount);
        } else {
          chargeBySession.set(payment.sessionId, {
            totalAmount: Number(payment.amount),
            date: payment.createdAt.toISOString(),
            stationName: payment.session?.connector?.station?.name ?? null,
            sessionId: payment.sessionId,
          });
        }
      } else {
        nonChargePayments.push(payment);
      }
    }

    // Формируем итоговый список транзакций
    const transactions: Array<{
      id: string;
      type: string;
      amount: number;
      date: string;
      description: string;
      stationName?: string | null;
      status: string;
    }> = [];

    // Добавляем сгруппированные зарядки
    for (const [sessionId, data] of chargeBySession.entries()) {
      const stationName = data.stationName;
      const description = stationName
        ? `Зарядка на станции ${stationName}`
        : "Зарядка на станции";
      transactions.push({
        id: `charge-${sessionId}`,
        type: "charge",
        amount: -data.totalAmount,
        date: data.date,
        description,
        stationName,
        status: "success",
      });
    }

    // Добавляем остальные платежи
    for (const payment of nonChargePayments) {
      let description = "";
      switch (payment.type) {
        case "topup":
          description = "Пополнение баланса";
          break;
        case "deposit":
          description = "Депозит за бронирование";
          break;
        case "refund":
          description = "Возврат средств";
          break;
        default:
          description = "Операция";
      }

      const stationName = payment.session?.connector?.station?.name ?? null;

      transactions.push({
        id: payment.id,
        type: payment.type,
        amount:
          payment.type === "deposit"
            ? -Number(payment.amount)
            : Number(payment.amount),
        date: payment.createdAt.toISOString(),
        description,
        stationName,
        status: payment.status,
      });
    }

    // Сортируем по дате (новые первыми)
    transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json({ transactions: transactions.slice(0, 50) });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
