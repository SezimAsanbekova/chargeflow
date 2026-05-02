import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET - Получить список всех станций
export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin-token')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(adminToken);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем все станции с коннекторами
    const stations = await prisma.station.findMany({
      include: {
        connectors: true,
        _count: {
          select: {
            connectors: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ stations });
  } catch (error) {
    console.error('Error fetching stations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Создать новую станцию
export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin-token')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(adminToken);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, address, latitude, longitude, workingHours, status, connectors } =
      await request.json();

    // Валидация
    if (!name || !address || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Name, address, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Создаем станцию с коннекторами
    const station = await prisma.station.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        workingHours: workingHours || { "24/7": true },
        status: status || 'active',
        connectors: {
          create: connectors || [],
        },
      },
      include: {
        connectors: true,
      },
    });

    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    console.error('Error creating station:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
