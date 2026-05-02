import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Admin Users API Called ===');
    
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    console.log('Token payload:', payload);
    
    if (!payload || payload.role !== 'admin') {
      console.log('Invalid token or not admin');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Fetching users from database...');
    
    // Get all users with session count (exclude admins)
    const users = await prisma.user.findMany({
      where: {
        role: 'user', // Только обычные пользователи, не админы
      },
      select: {
        id: true,
        phone: true,
        email: true,
        status: true,
        _count: {
          select: {
            chargingSessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found users:', users.length);

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      phone: user.phone || 'Не указан',
      email: user.email,
      isBlocked: user.status === 'blocked',
      sessionCount: user._count.chargingSessions,
    }));

    console.log('Returning formatted users:', formattedUsers.length);
    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
