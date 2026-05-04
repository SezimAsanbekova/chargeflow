import { NextRequest, NextResponse } from 'next/server';

// Кэш для reverse geocoding
const reverseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 60 минут

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const cacheKey = `${lat},${lon}`;

    // Проверяем кэш
    const cached = reverseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Reverse cache hit:', cacheKey);
      return NextResponse.json(cached.data);
    }

    console.log('🔍 Reverse geocoding:', cacheKey);

    // Пробуем Nominatim для reverse geocoding (более надежный для этого)
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Небольшая задержка
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`,
        {
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'ChargeFlow/1.0',
            'Referer': 'https://chargeflow.kg'
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Сохраняем в кэш
        reverseCache.set(cacheKey, { data, timestamp: Date.now() });
        
        // Очищаем старые записи
        if (reverseCache.size > 200) {
          const entries = Array.from(reverseCache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          const toDelete = entries.slice(0, 50);
          toDelete.forEach(([key]) => reverseCache.delete(key));
        }

        console.log('✅ Reverse geocoding success');
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error('⚠️ Reverse geocoding failed:', error);
    }

    // Если не получилось, возвращаем координаты как адрес
    return NextResponse.json({
      display_name: `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
      lat,
      lon
    });
  } catch (error: any) {
    console.error('❌ Reverse geocoding error:', error.message);
    return NextResponse.json(
      { display_name: 'Неизвестный адрес' },
      { status: 200 }
    );
  }
}
