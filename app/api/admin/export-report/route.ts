import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(adminToken);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Экспорт за весь период
    let startDate = new Date(2020, 0, 1); // С 1 января 2020
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Получаем данные для отчета
    const [sessions, payments, bookings] = await Promise.all([
      prisma.chargingSession.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          connector: {
            include: {
              station: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'success',
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          connector: {
            include: {
              station: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Формируем CSV
    let csv = 'Тип,Дата,Пользователь,Email,Станция,Сумма,Статус\n';

    sessions.forEach((session) => {
      csv += `Зарядка,${session.createdAt.toLocaleString('ru-RU')},${session.user.name || 'Без имени'},${session.user.email},${session.connector.station.name},${session.costTotal} сом,${session.status}\n`;
    });

    payments.forEach((payment) => {
      csv += `Платеж,${payment.createdAt.toLocaleString('ru-RU')},${payment.user.name || 'Без имени'},${payment.user.email},-,${payment.amount} сом,${payment.status}\n`;
    });

    bookings.forEach((booking) => {
      csv += `Бронь,${booking.createdAt.toLocaleString('ru-RU')},${booking.user.name || 'Без имени'},${booking.user.email},${booking.connector.station.name},${booking.depositAmount} сом,${booking.status}\n`;
    });

    // Возвращаем CSV файл
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error in admin/export-report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
