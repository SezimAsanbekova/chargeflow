import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get period from query
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get payments in date range
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const totalPayments = payments.length;
    const totalRevenue = payments
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const successfulPayments = payments.filter((p) => p.status === 'success').length;
    const pendingPayments = payments.filter((p) => p.status === 'pending').length;
    const failedPayments = payments.filter((p) => p.status === 'failed').length;
    
    const averagePayment = successfulPayments > 0 
      ? totalRevenue / successfulPayments 
      : 0;

    return NextResponse.json({
      totalRevenue,
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      averagePayment,
      payments,
    });
  } catch (error) {
    console.error('Error fetching finance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
}
