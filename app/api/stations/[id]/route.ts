import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  let stationId: string | undefined;
  
  try {
    const params = await context.params;
    stationId = params.id;

    if (!stationId) {
      return NextResponse.json(
        { error: 'ID станции не указан' },
        { status: 400 }
      );
    }

    console.log('Fetching station:', stationId);

    // Получаем станцию с коннекторами
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        connectors: true
      }
    });

    console.log('Station found:', station ? 'yes' : 'no');
    if (station) {
      console.log('Connectors count:', station.connectors.length);
    }

    if (!station) {
      return NextResponse.json(
        { error: 'Станция не найдена' },
        { status: 404 }
      );
    }

    // Проверяем наличие коннекторов
    if (!station.connectors || station.connectors.length === 0) {
      return NextResponse.json(
        { error: 'У станции нет коннекторов' },
        { status: 400 }
      );
    }

    // Находим коннектор с максимальной мощностью
    const maxPowerConnector = station.connectors.reduce((max, connector) => 
      Number(connector.powerKw) > Number(max.powerKw) ? connector : max
    , station.connectors[0]);

    return NextResponse.json({
      id: station.id,
      name: station.name,
      address: station.address,
      latitude: Number(station.latitude),
      longitude: Number(station.longitude),
      pricePerMinute: Number(maxPowerConnector.pricePerKwh),
      maxPowerKw: Number(maxPowerConnector.powerKw),
      status: station.status,
      connectors: station.connectors.map(c => ({
        id: c.id,
        type: c.type,
        status: c.status,
        maxPowerKw: Number(c.powerKw),
        pricePerKwh: Number(c.pricePerKwh)
      }))
    });

  } catch (error) {
    console.error('Get station error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      stationId: stationId
    });
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
