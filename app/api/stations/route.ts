import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Получаем все станции с их коннекторами (включая обслуживание и отключенные)
    const stations = await prisma.station.findMany({
      include: {
        connectors: true,
      },
    });

    // Преобразуем данные в формат, который ожидает фронтенд
    const formattedStations = stations.map((station) => {
        // Находим коннектор с максимальной мощностью (если есть)
        const maxPowerConnector = station.connectors.length > 0 
          ? station.connectors.reduce((max, connector) => {
              return Number(connector.powerKw) > Number(max.powerKw) ? connector : max;
            }, station.connectors[0])
          : null;

        // Определяем статус станции
        let status: 'available' | 'busy' | 'maintenance' = 'maintenance';
        
        // Если станция в обслуживании или отключена
        if (station.status === 'maintenance' || station.status === 'inactive') {
          status = 'maintenance';
        } else if (station.connectors.length > 0) {
          const hasAvailable = station.connectors.some(c => c.status === 'available');
          const allBusy = station.connectors.every(c => c.status === 'busy');
          
          if (hasAvailable) {
            status = 'available';
          } else if (allBusy) {
            status = 'busy';
          }
        }

        return {
          id: station.id,
          name: station.name,
          address: station.address,
          latitude: Number(station.latitude),
          longitude: Number(station.longitude),
          status,
          maxPowerKw: maxPowerConnector ? Number(maxPowerConnector.powerKw) : 50,
          pricePerMinute: maxPowerConnector ? Number(maxPowerConnector.pricePerKwh) : 0,
          connectorType: maxPowerConnector?.type || 'CCS2',
          connectors: station.connectors.map(c => ({
            id: c.id,
            type: c.type,
            powerKw: Number(c.powerKw),
            pricePerKwh: Number(c.pricePerKwh),
            status: c.status,
          })),
        };
      });

    return NextResponse.json(formattedStations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}
