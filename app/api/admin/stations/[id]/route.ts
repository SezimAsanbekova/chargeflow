import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET - Получить одну станцию
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const adminToken = request.cookies.get('admin-token')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(adminToken);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        connectors: true,
        photos: true,
      },
    });

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    return NextResponse.json({ station });
  } catch (error) {
    console.error('Error fetching station:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Обновить станцию
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Проверяем существование станции
    const existingStation = await prisma.station.findUnique({
      where: { id },
    });

    if (!existingStation) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    // Обновляем станцию
    const station = await prisma.station.update({
      where: { id },
      data: {
        name,
        address,
        latitude,
        longitude,
        workingHours,
        status,
      },
      include: {
        connectors: true,
      },
    });

    // Если переданы коннекторы, обновляем их
    if (connectors && Array.isArray(connectors)) {
      // Удаляем старые коннекторы
      await prisma.connector.deleteMany({
        where: { stationId: id },
      });

      // Создаем новые
      await prisma.connector.createMany({
        data: connectors.map((c: any) => ({
          ...c,
          stationId: id,
        })),
      });
    }

    // Получаем обновленную станцию с коннекторами
    const updatedStation = await prisma.station.findUnique({
      where: { id },
      include: {
        connectors: true,
      },
    });

    return NextResponse.json({ station: updatedStation });
  } catch (error) {
    console.error('Error updating station:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить станцию
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const adminToken = request.cookies.get('admin-token')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(adminToken);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Проверяем существование станции
    const existingStation = await prisma.station.findUnique({
      where: { id },
    });

    if (!existingStation) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    // Удаляем станцию (каскадно удалятся коннекторы)
    await prisma.station.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting station:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
