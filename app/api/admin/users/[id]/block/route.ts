import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { isBlocked } = body;

    if (typeof isBlocked !== 'boolean') {
      return NextResponse.json(
        { error: 'isBlocked must be a boolean' },
        { status: 400 }
      );
    }

    // Update user block status
    const user = await prisma.user.update({
      where: { id },
      data: { status: isBlocked ? 'blocked' : 'active' },
      select: {
        id: true,
        phone: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({ 
      user: {
        ...user,
        isBlocked: user.status === 'blocked'
      }
    });
  } catch (error) {
    console.error('Error updating user block status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
