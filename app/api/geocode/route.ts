import { NextRequest, NextResponse } from 'next/server';

// Простой кэш для результатов поиска
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 3) {
      return NextResponse.json([], { status: 200 });
    }

    // Проверяем кэш
    const cached = cache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Cache hit:', query);
      return NextResponse.json(cached.data);
    }

    console.log('🔍 Searching:', query);
    
    // Пробуем несколько API по очереди
    let data: any[] = [];
    
    // 1. Пробуем Photon API (быстрый, но может не работать)
    try {
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=ru&bbox=69.464,39.172,80.259,43.238`,
        { 
          signal: AbortSignal.timeout(3000),
          headers: { 'Accept': 'application/json' }
        }
      );

      if (photonResponse.ok) {
        const photonData = await photonResponse.json();
        data = photonData.features?.map((feature: any) => ({
          lat: feature.geometry.coordinates[1].toString(),
          lon: feature.geometry.coordinates[0].toString(),
          display_name: [
            feature.properties.name,
            feature.properties.street,
            feature.properties.city || feature.properties.county,
            feature.properties.state,
            'Кыргызстан'
          ].filter(Boolean).join(', '),
        })) || [];
        
        if (data.length > 0) {
          console.log(`✅ Photon: ${data.length} results`);
        }
      }
    } catch (error) {
      console.log('⚠️ Photon failed, trying Nominatim...');
    }

    // 2. Если Photon не сработал, пробуем Nominatim (с задержкой)
    if (data.length === 0) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка 1 сек
        
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=8&accept-language=ru&countrycodes=kg&bounded=1&viewbox=69.464,43.238,80.259,39.172`,
          {
            signal: AbortSignal.timeout(5000),
            headers: {
              'User-Agent': 'ChargeFlow/1.0',
              'Referer': 'https://chargeflow.kg'
            },
          }
        );

        if (nominatimResponse.ok) {
          data = await nominatimResponse.json();
          console.log(`✅ Nominatim: ${data.length} results`);
        }
      } catch (error) {
        console.log('⚠️ Nominatim also failed');
      }
    }

    // 3. Если оба API не сработали, возвращаем старый кэш если есть
    if (data.length === 0 && cached) {
      console.log('⚠️ Using expired cache');
      return NextResponse.json(cached.data);
    }

    // Сохраняем в кэш
    if (data.length > 0) {
      cache.set(query, { data, timestamp: Date.now() });
      
      // Очищаем старые записи
      if (cache.size > 300) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(0, 100);
        toDelete.forEach(([key]) => cache.delete(key));
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Geocoding error:', error.message);
    return NextResponse.json([], { status: 200 });
  }
}
