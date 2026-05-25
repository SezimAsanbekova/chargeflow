import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Функция для вычисления расстояния между двумя точками (формула Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Радиус Земли в км
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const { userLocation } = await req.json();

    // Получаем все станции с коннекторами
    const stations = await prisma.station.findMany({
      where: {
        status: "active",
      },
      include: {
        connectors: true,
      },
    });

    // Получаем активные бронирования
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: "active",
        endTime: {
          gte: new Date(),
        },
      },
      include: {
        connector: {
          include: {
            station: true,
          },
        },
      },
    });

    // Получаем активные сессии зарядки
    const activeSessions = await prisma.chargingSession.findMany({
      where: {
        status: {
          in: ["active", "created"],
        },
        endTime: null,
      },
    });

    // Формируем данные о станциях
    const stationsData = stations.map((station) => {
      const connectors = station.connectors.map((connector) => {
        // Проверяем, занят ли коннектор
        const hasActiveBooking = activeBookings.some(
          (b) => b.connectorId === connector.id
        );
        const hasActiveSession = activeSessions.some(
          (s) => s.connectorId === connector.id
        );

        const isOccupied = hasActiveBooking || hasActiveSession;
        const actualStatus = isOccupied ? "busy" : connector.status;

        // Находим время освобождения
        let availableAt = null;
        if (isOccupied) {
          const booking = activeBookings.find(
            (b) => b.connectorId === connector.id
          );
          if (booking) {
            availableAt = booking.endTime;
          }
        }

        return {
          id: connector.id,
          type: connector.type,
          powerKw: Number(connector.powerKw),
          pricePerKwh: Number(connector.pricePerKwh),
          pricePerMinute: Number(connector.pricePerMinute),
          status: actualStatus,
          availableAt: availableAt,
        };
      });

      // Вычисляем расстояние, если указано местоположение пользователя
      let distance = null;
      if (userLocation?.latitude && userLocation?.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          Number(station.latitude),
          Number(station.longitude)
        );
      }

      return {
        id: station.id,
        name: station.name,
        address: station.address,
        latitude: Number(station.latitude),
        longitude: Number(station.longitude),
        status: station.status,
        distance: distance ? Math.round(distance * 10) / 10 : null,
        connectors: connectors,
        availableConnectors: connectors.filter((c) => c.status === "available")
          .length,
        totalConnectors: connectors.length,
      };
    });

    // Сортируем по расстоянию, если указано местоположение
    if (userLocation?.latitude && userLocation?.longitude) {
      stationsData.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return NextResponse.json({
      stations: stationsData,
      totalStations: stationsData.length,
      availableStations: stationsData.filter((s) => s.availableConnectors > 0)
        .length,
      userLocation: userLocation || null,
    });
  } catch (error: any) {
    console.error("AI context error:", error);
    return NextResponse.json(
      { error: "Failed to fetch context", message: error.message },
      { status: 500 }
    );
  }
}
