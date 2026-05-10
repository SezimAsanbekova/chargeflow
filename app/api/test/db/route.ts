import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Проверяем подключение к БД
    await prisma.$connect();
    
    // Считаем записи
    const stationsCount = await prisma.station.count();
    const connectorsCount = await prisma.connector.count();
    const usersCount = await prisma.user.count();
    const vehiclesCount = await prisma.vehicle.count();
    
    // Получаем первую станцию с коннекторами
    const firstStation = await prisma.station.findFirst({
      include: {
        connectors: true
      }
    });
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      counts: {
        stations: stationsCount,
        connectors: connectorsCount,
        users: usersCount,
        vehicles: vehiclesCount
      },
      firstStation: firstStation ? {
        id: firstStation.id,
        name: firstStation.name,
        connectorsCount: firstStation.connectors.length,
        connectors: firstStation.connectors.map(c => ({
          id: c.id,
          type: c.type,
          status: c.status,
          powerKw: Number(c.powerKw),
          pricePerKwh: Number(c.pricePerKwh)
        }))
      } : null
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
