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

    // Get all bookings
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        connector: {
          select: {
            type: true,
            station: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
