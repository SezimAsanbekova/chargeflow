'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Maximize2, Navigation, Plus, Minus, X, MapPin, List, Wallet, User, SlidersHorizontal, Route, Clock, MapPinned, Search } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'maintenance';
  maxPowerKw: number;
  pricePerMinute: number;
  connectorType: string;
}

export default function MapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'balance'>('map');
  const [showFilter, setShowFilter] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [filters, setFilters] = useState({
    stationType: [] as string[],
    connectorType: [] as string[],
    minPower: 20,
    maxPower: 250,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [nearbyStations, setNearbyStations] = useState<Station[]>([]);
  const [showOnlyNearby, setShowOnlyNearby] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
    durationInTraffic?: number;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<number | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const [showNavigationDetails, setShowNavigationDetails] = useState(false);

  // Функция для определения типа станции по мощности
  const getStationType = (powerKw: number): string => {
    if (powerKw < 50) return 'slow';
    if (powerKw < 150) return 'fast';
    return 'ultra';
  };

  // Подсчет активных фильтров
  const activeFiltersCount = 
    filters.stationType.length + 
    filters.connectorType.length + 
    (filters.minPower !== 20 || filters.maxPower !== 250 ? 1 : 0);

  // Фильтрация станций с использованием useMemo
  const filteredStations = useMemo(() => {
    // Если показываем только ближайшие станции, используем их
    const stationsToFilter = showOnlyNearby ? nearbyStations : stations;
    
    const filtered = stationsToFilter.filter((station) => {
      // Поиск по названию и адресу
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = station.name.toLowerCase().includes(query);
        const matchesAddress = station.address.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress) {
          return false;
        }
      }

      // Если показываем только ближайшие, не применяем дополнительные фильтры
      if (showOnlyNearby) {
        return true;
      }

      // Фильтр по статусу станции (свободна/обслуживание)
      if (filters.stationType.length > 0) {
        if (filters.stationType.includes('available') && station.status !== 'available') {
          return false;
        }
        if (filters.stationType.includes('maintenance') && station.status !== 'maintenance') {
          return false;
        }
      }

      // Фильтр по типу коннектора
      if (filters.connectorType.length > 0) {
        if (!filters.connectorType.includes(station.connectorType)) {
          return false;
        }
      }

      // Фильтр по мощности
      if (station.maxPowerKw < filters.minPower || station.maxPowerKw > filters.maxPower) {
        return false;
      }

      return true;
    });
    
    return filtered;
  }, [stations, filters, searchQuery, showOnlyNearby, nearbyStations]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Загружаем станции из API
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setIsLoadingStations(true);
        const response = await fetch('/api/stations');
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded stations:', data);
          setStations(data);
        } else {
          console.error('Failed to fetch stations');
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
      } finally {
        setIsLoadingStations(false);
      }
    };

    if (session) {
      fetchStations();
    }
  }, [session]);

  // Автоматически ищем ближайшие станции когда загрузились станции и определилось местоположение
  useEffect(() => {
    if (stations.length > 0 && userLocation && !showOnlyNearby) {
      // Добавляем небольшую задержку, чтобы карта успела инициализироваться
      const timer = setTimeout(() => {
        findNearbyStationsAutomatically(userLocation[1], userLocation[0]); // lat, lng
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [stations, userLocation]);

  // Получаем баланс пользователя
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/user/balance');
        if (response.ok) {
          const data = await response.json();
          setUserBalance(Number(data.balance));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    if (session) {
      fetchBalance();
    }
  }, [session]);

  // Получаем местоположение пользователя и автоматически показываем ближайшие станции
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Используем центр Бишкека по умолчанию
          setUserLocation([74.6057, 42.8746]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setUserLocation([74.6057, 42.8746]);
    }
  }, []);

  // Функция для автоматического поиска ближайших станций при загрузке
  const findNearbyStationsAutomatically = (lat: number, lng: number) => {
    console.log('🔍 Автоматический поиск ближайших станций...');
    console.log('📍 Местоположение пользователя:', lat, lng);
    console.log('🏢 Всего станций:', stations.length);
    
    // Фильтруем только активные станции и сортируем по расстоянию
    const activeStations = stations.filter(station => station.status === 'available');
    console.log('✅ Активных станций:', activeStations.length);
    
    const stationsWithDistance = activeStations.map(station => {
      const distance = calculateDistance(lat, lng, station.latitude, station.longitude);
      return { ...station, distance };
    });
    
    // Сортируем по расстоянию и берем ближайшие (в радиусе 15 км)
    const nearbyStations = stationsWithDistance
      .filter(station => station.distance <= 15) // Увеличиваем радиус до 15 км для автоматического поиска
      .sort((a, b) => a.distance - b.distance);
    
    console.log('📍 Ближайших станций (в радиусе 15км):', nearbyStations.length);
    
    if (nearbyStations.length > 0) {
      // Устанавливаем ближайшие станции и включаем режим "только ближайшие"
      setNearbyStations(nearbyStations);
      setShowOnlyNearby(true);
      console.log('✅ Автоматически найдено', nearbyStations.length, 'активных станций рядом');
      console.log('🗺️ Ближайшие станции:', nearbyStations.map(s => `${s.name} (${s.distance.toFixed(1)}км)`));
      
      // Центрируем карту на области с ближайшими станциями
      if (map.current && nearbyStations.length > 0) {
        if (nearbyStations.length === 1) {
          // Если только одна станция, центрируем на ней
          map.current.flyTo({
            center: [nearbyStations[0].longitude, nearbyStations[0].latitude],
            zoom: 14,
          });
        } else {
          // Если несколько станций, подгоняем карту под все ближайшие станции
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([lng, lat]); // Добавляем местоположение пользователя
          nearbyStations.forEach(station => {
            bounds.extend([station.longitude, station.latitude]);
          });
          
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15
          });
        }
      }
    } else {
      console.log('❌ Ближайших активных станций не найдено');
    }
  };

  // Функция для получения текущего местоположения и поиска ближайших станций (по кнопке)
  const findNearbyStations = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(newLocation);
          
          // Фильтруем только активные станции и сортируем по расстоянию
          const activeStations = stations.filter(station => station.status === 'available');
          const stationsWithDistance = activeStations.map(station => {
            const distance = calculateDistance(
              position.coords.latitude,
              position.coords.longitude,
              station.latitude,
              station.longitude
            );
            return { ...station, distance };
          });
          
          // Сортируем по расстоянию и берем ближайшие (в радиусе 10 км)
          const nearbyStations = stationsWithDistance
            .filter(station => station.distance <= 10) // Только в радиусе 10 км
            .sort((a, b) => a.distance - b.distance);
          
          if (nearbyStations.length > 0) {
            // Устанавливаем ближайшие станции и включаем режим "только ближайшие"
            setNearbyStations(nearbyStations);
            setShowOnlyNearby(true);
            setSearchQuery(''); // Очищаем поиск
            
            // Показываем уведомление
            alert(`Найдено ${nearbyStations.length} активных станций рядом с вами!\nБлижайшая: ${nearbyStations[0].name} (${nearbyStations[0].distance.toFixed(1)} км)`);
          } else {
            alert('Рядом с вами нет активных станций в радиусе 10 км');
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Не удалось определить ваше местоположение. Проверьте разрешения браузера.');
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Геолокация не поддерживается вашим браузером');
      setIsGettingLocation(false);
    }
  };

  // Функция для вычисления расстояния между двумя точками (формула гаверсинуса)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Инициализация карты только когда вкладка карты активна
  useEffect(() => {
    // Если не на вкладке карты, не инициализируем
    if (activeTab !== 'map') return;
    
    // Если нет контейнера или местоположения, не инициализируем
    if (!mapContainer.current || !userLocation) return;

    // Если карта уже инициализирована, просто делаем resize
    if (map.current) {
      setTimeout(() => {
        map.current?.resize();
        console.log('Map resized');
      }, 100);
      return;
    }

    // Инициализируем карту
    console.log('Initializing map...');
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: userLocation,
      zoom: 13,
    });

    // Ждём загрузки карты
    map.current.on('load', () => {
      console.log('Map loaded successfully');
      setMapInitialized(true);
    });

    // Добавляем маркер местоположения пользователя
    const userMarker = new maplibregl.Marker({ color: '#3b82f6' })
      .setLngLat(userLocation)
      .addTo(map.current);

    return () => {
      // Не удаляем карту при размонтировании, только при смене местоположения
    };
  }, [activeTab, userLocation]);

  // Очистка карты при размонтировании компонента
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Обновление маркеров при изменении фильтров
  useEffect(() => {
    if (!map.current || isLoadingStations || !mapInitialized) return;

    console.log('Updating markers, filtered stations:', filteredStations.length);

    // Удаляем все существующие маркеры станций
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Добавляем маркеры отфильтрованных станций
    filteredStations.forEach((station) => {
      console.log('Adding marker for station:', station.name);
      const el = document.createElement('div');
      el.className = 'station-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50% 50% 50% 0';
      el.style.transform = 'rotate(-45deg)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

      // Цвет в зависимости от статуса
      if (station.status === 'available') {
        el.style.backgroundColor = '#10b981';
      } else if (station.status === 'busy') {
        el.style.backgroundColor = '#f59e0b';
      } else {
        el.style.backgroundColor = '#ef4444';
      }

      // Иконка молнии
      const icon = document.createElement('div');
      icon.innerHTML = '⚡';
      icon.style.transform = 'rotate(45deg)';
      icon.style.fontSize = '20px';
      el.appendChild(icon);

      el.addEventListener('click', () => {
        setSelectedStation(station);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([station.longitude, station.latitude])
        .addTo(map.current!);
      
      markersRef.current.push(marker);
    });
  }, [filteredStations, isLoadingStations, mapInitialized]);

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const handleGoToUserLocation = () => {
    if (userLocation && map.current) {
      map.current.flyTo({
        center: userLocation,
        zoom: 15,
      });
    }
  };

  const handleFullscreen = () => {
    if (mapContainer.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapContainer.current.requestFullscreen();
      }
    }
  };

  const buildRoute = async (station: Station) => {
    if (!userLocation || !map.current) return;

    setIsLoadingRoute(true);
    setRouteInfo(null);

    try {
      // Используем OSRM API для построения маршрута с пошаговыми инструкциями
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[0]},${userLocation[1]};${station.longitude},${station.latitude}?overview=full&geometries=geojson&steps=true&annotations=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates;

      // Извлекаем пошаговые инструкции
      const steps = route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.type === 'depart' 
          ? 'Начните движение' 
          : step.maneuver.type === 'arrive' 
          ? 'Вы прибыли к месту назначения'
          : step.maneuver.type === 'turn' && step.maneuver.modifier === 'left'
          ? 'Поверните налево'
          : step.maneuver.type === 'turn' && step.maneuver.modifier === 'right'
          ? 'Поверните направо'
          : step.maneuver.type === 'turn' && step.maneuver.modifier === 'slight left'
          ? 'Поверните слегка налево'
          : step.maneuver.type === 'turn' && step.maneuver.modifier === 'slight right'
          ? 'Поверните слегка направо'
          : step.maneuver.type === 'turn' && step.maneuver.modifier === 'sharp left'
          ? 'Резко поверните налево'
          : step.maneuver.type === 'turn' && step.maneuver.modifier === 'sharp right'
          ? 'Резко поверните направо'
          : step.maneuver.type === 'continue'
          ? 'Продолжайте движение прямо'
          : step.maneuver.type === 'roundabout'
          ? 'Въезжайте на круговое движение'
          : step.maneuver.type === 'rotary'
          ? 'Въезжайте на кольцо'
          : step.maneuver.type === 'merge'
          ? 'Перестройтесь'
          : step.maneuver.type === 'fork' && step.maneuver.modifier === 'left'
          ? 'На развилке держитесь левее'
          : step.maneuver.type === 'fork' && step.maneuver.modifier === 'right'
          ? 'На развилке держитесь правее'
          : step.maneuver.type === 'end of road' && step.maneuver.modifier === 'left'
          ? 'В конце дороги поверните налево'
          : step.maneuver.type === 'end of road' && step.maneuver.modifier === 'right'
          ? 'В конце дороги поверните направо'
          : 'Продолжайте движение',
        distance: step.distance,
        duration: step.duration,
      }));

      // Удаляем предыдущий маршрут, если есть
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      // Добавляем маршрут на карту
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 5,
          'line-opacity': 0.8,
        },
      });

      // Подгоняем карту под маршрут
      const bounds = coordinates.reduce(
        (bounds: maplibregl.LngLatBounds, coord: [number, number]) => {
          return bounds.extend(coord as [number, number]);
        },
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
      );

      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 350, left: 50, right: 50 },
      });

      // Сохраняем информацию о маршруте
      // Симулируем учет пробок (добавляем 10-30% к времени в зависимости от времени суток)
      const currentHour = new Date().getHours();
      let trafficMultiplier = 1.0;
      
      // Утренний час пик (7-10)
      if (currentHour >= 7 && currentHour <= 10) {
        trafficMultiplier = 1.25;
      }
      // Вечерний час пик (17-20)
      else if (currentHour >= 17 && currentHour <= 20) {
        trafficMultiplier = 1.3;
      }
      // Обеденное время (12-14)
      else if (currentHour >= 12 && currentHour <= 14) {
        trafficMultiplier = 1.15;
      }
      // Ночное время (свободные дороги)
      else if (currentHour >= 22 || currentHour <= 6) {
        trafficMultiplier = 0.95;
      }

      const baseDuration = route.duration / 60; // в минутах
      const durationWithTraffic = baseDuration * trafficMultiplier;

      setRouteInfo({
        distance: route.distance / 1000, // конвертируем в км
        duration: baseDuration,
        durationInTraffic: durationWithTraffic,
        steps: steps,
      });
    } catch (error) {
      console.error('Error building route:', error);
      alert('Не удалось построить маршрут. Попробуйте еще раз.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const clearRoute = () => {
    stopNavigation();
    if (map.current && map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    setRouteInfo(null);
    setCurrentStepIndex(0);
  };

  const startNavigation = () => {
    if (!routeInfo) return;
    
    setIsNavigating(true);
    setTripStartTime(Date.now());
    setCurrentStepIndex(0);

    // Отслеживаем местоположение пользователя в реальном времени
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(newLocation);

          // Обновляем маркер пользователя на карте
          if (map.current) {
            map.current.flyTo({
              center: newLocation,
              zoom: 17,
              bearing: position.coords.heading || 0,
            });
          }

          // Проверяем, достиг ли пользователь следующего шага
          // (упрощенная логика - в реальном приложении нужна более сложная проверка)
          if (routeInfo && currentStepIndex < routeInfo.steps.length - 1) {
            // Автоматически переходим к следующему шагу через некоторое время
            // В реальном приложении нужно проверять расстояние до точки поворота
          }
        },
        (error) => {
          console.error('Error tracking location:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setShowNavigationDetails(false);
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const finishTrip = () => {
    if (!tripStartTime) return;

    const tripDuration = (Date.now() - tripStartTime) / 1000 / 60; // в минутах
    const estimatedDuration = routeInfo?.durationInTraffic || routeInfo?.duration || 0;
    const difference = tripDuration - estimatedDuration;
    const differenceText = difference > 0 
      ? `на ${Math.abs(Math.round(difference))} мин дольше` 
      : `на ${Math.abs(Math.round(difference))} мин быстрее`;

    alert(
      `🎉 Поездка завершена!\n\n` +
      `📍 Расстояние: ${routeInfo?.distance.toFixed(1)} км\n` +
      `⏱️ Запланированное время: ${Math.round(estimatedDuration)} мин\n` +
      `✅ Фактическое время: ${Math.round(tripDuration)} мин\n` +
      `${Math.abs(difference) > 1 ? `📊 Разница: ${differenceText}` : '✨ Точно по расписанию!'}`
    );

    stopNavigation();
    setTripStartTime(null);
    clearRoute();
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Свободна';
      case 'busy':
        return 'Занята';
      case 'maintenance':
        return 'Обслуживание';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-emerald-400';
      case 'busy':
        return 'text-yellow-400';
      case 'maintenance':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (status === 'loading' || !userLocation) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка карты...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative h-screen w-full bg-[#0a1f1a] flex flex-col">
      {/* Map Container - всегда в DOM, но скрывается через CSS */}
      <div 
        ref={mapContainer} 
        className={`flex-1 w-full ${activeTab === 'map' ? 'block' : 'hidden'}`} 
      />

      {/* Map Overlays - показываются только на вкладке карты */}
      {activeTab === 'map' && (
        <>
          {/* Loading Stations Indicator */}
          {isLoadingStations && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-[#0f2d26] border border-emerald-500/30 rounded-lg px-6 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                <span className="text-white font-medium">Загрузка станций...</span>
              </div>
            </div>
          )}

          {/* No Stations Message */}
          {!isLoadingStations && filteredStations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-[#0f2d26] border-2 border-emerald-500/30 rounded-2xl p-8 shadow-2xl max-w-md mx-4 pointer-events-auto">
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="text-emerald-400" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {stations.length === 0 ? 'Станций пока нет' : 'Таких станций еще нет'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {stations.length === 0 
                      ? 'Администратор еще не добавил зарядные станции' 
                      : 'Скоро добавим! Попробуйте изменить параметры фильтрации'}
                  </p>
                  {stations.length > 0 && (
                    <button
                      onClick={() => setShowFilter(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 mx-auto"
                    >
                      <SlidersHorizontal size={20} />
                      Изменить фильтры
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute right-4 top-20 z-10 flex flex-col gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilter(true)}
              className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition relative"
            >
              <SlidersHorizontal size={24} className="text-gray-700" />
              {activeFiltersCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{activeFiltersCount}</span>
                </div>
              )}
            </button>
            
            <button
              onClick={handleZoomIn}
              className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition"
            >
              <Plus size={24} className="text-gray-700" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition"
            >
              <Minus size={24} className="text-gray-700" />
            </button>
            <button
              onClick={handleGoToUserLocation}
              className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition"
            >
              <Navigation size={24} className="text-blue-500" />
            </button>
            <button
              onClick={handleFullscreen}
              className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-100 transition"
            >
              <Maximize2 size={24} className="text-gray-700" />
            </button>
          </div>

          {/* Navigation Mode - Yandex Style */}
          {isNavigating && routeInfo && (
            <>
              {/* Top Bar - Distance and Time */}
              <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
                <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {(routeInfo.steps.slice(currentStepIndex).reduce((sum, step) => sum + step.distance, 0) / 1000).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 leading-tight">
                    <div>км</div>
                    <div className="font-medium text-gray-900">
                      {Math.round(routeInfo.steps.slice(currentStepIndex).reduce((sum, step) => sum + step.duration, 0) / 60)} мин
                    </div>
                  </div>
                </div>

                <div className="flex-1"></div>

                <button
                  onClick={finishTrip}
                  className="bg-white rounded-2xl shadow-lg p-3 hover:bg-gray-50 transition"
                >
                  <X size={24} className="text-gray-700" />
                </button>
              </div>

              {/* Main Navigation Card - Yandex Style */}
              <div className="absolute bottom-6 left-4 right-4 z-10">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto">
                  {/* Current Instruction */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Direction Icon */}
                      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Navigation className="text-white" size={32} />
                      </div>
                      
                      {/* Instruction Text */}
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-500 text-sm mb-1">
                          Через {(routeInfo.steps[currentStepIndex].distance / 1000).toFixed(1)} км
                        </div>
                        <div className="text-gray-900 font-bold text-xl leading-tight">
                          {routeInfo.steps[currentStepIndex].instruction}
                        </div>
                      </div>
                    </div>

                    {/* Next Step Preview */}
                    {currentStepIndex < routeInfo.steps.length - 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Navigation className="text-gray-400" size={16} />
                          </div>
                          <div className="flex-1 text-gray-600">
                            {routeInfo.steps[currentStepIndex + 1].instruction}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {(routeInfo.steps[currentStepIndex + 1].distance / 1000).toFixed(1)} км
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setShowNavigationDetails(!showNavigationDetails)}
                        className="flex items-center gap-2 text-blue-500 font-medium text-sm"
                      >
                        {showNavigationDetails ? (
                          <>
                            <Minus size={18} />
                            <span>Скрыть</span>
                          </>
                        ) : (
                          <>
                            <List size={18} />
                            <span>Все шаги</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Clock size={16} />
                        <span className="font-medium text-gray-900">
                          {tripStartTime ? Math.floor((Date.now() - tripStartTime) / 1000 / 60) : 0} мин в пути
                        </span>
                      </div>
                    </div>

                    {/* Finish Trip Button */}
                    <button
                      onClick={finishTrip}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-semibold transition shadow-lg"
                    >
                      Завершить поездку
                    </button>
                  </div>

                  {/* Expandable Steps List */}
                  {showNavigationDetails && (
                    <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
                      {routeInfo.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3 ${
                            idx === currentStepIndex ? 'bg-blue-50' : 'bg-white'
                          }`}
                          onClick={() => setCurrentStepIndex(idx)}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            idx === currentStepIndex 
                              ? 'bg-blue-500 text-white' 
                              : idx < currentStepIndex
                              ? 'bg-gray-200 text-gray-400'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${
                              idx === currentStepIndex ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {step.instruction}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {(step.distance / 1000).toFixed(1)} км
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Station Card - Yandex Style (only when not navigating) */}
          {selectedStation && !isNavigating && (
            <div className="absolute bottom-24 left-4 right-4 z-10 bg-white rounded-3xl shadow-2xl max-w-md mx-auto overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedStation.name}</h3>
                    <p className="text-gray-500 text-sm">{selectedStation.address}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="text-gray-400 hover:text-gray-600 transition ml-2"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Route Info */}
              {routeInfo && (
                <div className="space-y-3 mb-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Route className="text-emerald-400" size={20} />
                      <span className="text-white font-medium">Маршрут построен</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <MapPinned className="text-emerald-400" size={16} />
                        <div>
                          <div className="text-gray-400 text-xs">Расстояние</div>
                          <div className="text-white font-medium">{routeInfo.distance.toFixed(1)} км</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="text-emerald-400" size={16} />
                        <div>
                          <div className="text-gray-400 text-xs">Время в пути</div>
                          <div className="text-white font-medium">
                            {Math.round(routeInfo.durationInTraffic || routeInfo.duration)} мин
                            {routeInfo.durationInTraffic && routeInfo.durationInTraffic > routeInfo.duration && (
                              <span className="text-yellow-400 text-xs ml-1">
                                (+{Math.round(routeInfo.durationInTraffic - routeInfo.duration)} мин пробки)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Traffic Indicator */}
                    {routeInfo.durationInTraffic && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Загруженность дорог:</span>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const trafficRatio = routeInfo.durationInTraffic / routeInfo.duration;
                              if (trafficRatio < 1.1) {
                                return (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span className="text-emerald-400 text-xs font-medium">Свободно</span>
                                  </>
                                );
                              } else if (trafficRatio < 1.3) {
                                return (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <span className="text-yellow-400 text-xs font-medium">Умеренно</span>
                                  </>
                                );
                              } else {
                                return (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <span className="text-red-400 text-xs font-medium">Пробки</span>
                                  </>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
              )}

              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Статус</div>
                    <div className={`font-semibold ${
                      selectedStation.status === 'available' ? 'text-green-600' :
                      selectedStation.status === 'busy' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getStatusText(selectedStation.status)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Мощность</div>
                    <div className="text-gray-900 font-semibold">{selectedStation.maxPowerKw} кВт</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Коннектор</div>
                    <div className="text-gray-900 font-semibold">{selectedStation.connectorType}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-gray-500 text-xs mb-1">Цена</div>
                    <div className="text-blue-600 font-semibold">{selectedStation.pricePerMinute} сом/мин</div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-2">
                {!routeInfo ? (
                  <button
                    onClick={() => buildRoute(selectedStation)}
                    disabled={isLoadingRoute}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    {isLoadingRoute ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Построение маршрута...</span>
                      </>
                    ) : (
                      <>
                        <Route size={20} />
                        <span>Построить маршрут</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startNavigation}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                      <Navigation size={20} />
                      <span>Начать поездку</span>
                    </button>
                    <button
                      onClick={clearRoute}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-medium transition"
                    >
                      Очистить маршрут
                    </button>
                  </>
                )}
                
                <button
                  disabled={selectedStation.status !== 'available'}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition shadow-lg shadow-green-500/30"
                >
                  {selectedStation.status === 'available' ? 'Забронировать' : 'Недоступно'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="flex-1 w-full overflow-y-auto p-4 pb-24">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            {showOnlyNearby ? 'Ближайшие станции' : 'Зарядные станции'}
          </h2>
          
          {/* Indicator for nearby mode */}
          {showOnlyNearby && (
            <div className="max-w-2xl mx-auto mb-4 bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <Navigation size={16} />
                <span className="text-sm font-medium">
                  Показаны ближайшие активные станции (в радиусе 15 км от вас)
                </span>
              </div>
            </div>
          )}
          
          {/* Search and Location */}
          <div className="max-w-2xl mx-auto mb-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск станций по названию или адресу..."
                className="w-full pl-10 pr-4 py-3 bg-[#0f2d26] border border-emerald-900/30 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            {/* Location Button */}
            <button
              onClick={findNearbyStations}
              disabled={isGettingLocation}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              {isGettingLocation ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Определяем местоположение...</span>
                </>
              ) : (
                <>
                  <Navigation size={20} />
                  <span>Обновить местоположение</span>
                </>
              )}
            </button>
            
            {/* Show All Stations Button - показывается только когда активен режим "только ближайшие" */}
            {showOnlyNearby && (
              <button
                onClick={() => {
                  setShowOnlyNearby(false);
                  setNearbyStations([]);
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <MapPin size={20} />
                <span>Показать все станции</span>
              </button>
            )}
          </div>
          
          {/* Фильтры по статусу */}
          <div className="max-w-2xl mx-auto mb-4 flex gap-2 justify-center">
            <button
              onClick={() => setFilters({ ...filters, stationType: [] })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filters.stationType.length === 0
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] text-gray-400 border border-emerald-900/30 hover:border-emerald-500/50'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => {
                const newFilters = { ...filters };
                if (newFilters.stationType.includes('available')) {
                  newFilters.stationType = [];
                } else {
                  newFilters.stationType = ['available'];
                }
                setFilters(newFilters);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filters.stationType.includes('available')
                  ? 'bg-green-500 text-white'
                  : 'bg-[#0f2d26] text-gray-400 border border-emerald-900/30 hover:border-emerald-500/50'
              }`}
            >
              Свободна
            </button>
            <button
              onClick={() => {
                const newFilters = { ...filters };
                if (newFilters.stationType.includes('maintenance')) {
                  newFilters.stationType = [];
                } else {
                  newFilters.stationType = ['maintenance'];
                }
                setFilters(newFilters);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filters.stationType.includes('maintenance')
                  ? 'bg-yellow-500 text-white'
                  : 'bg-[#0f2d26] text-gray-400 border border-emerald-900/30 hover:border-emerald-500/50'
              }`}
            >
              Обслуживание
            </button>
          </div>
          
          {isLoadingStations ? (
            <div className="max-w-2xl mx-auto bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-12 text-center">
              <div className="text-gray-400">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mb-4"></div>
                <p className="text-lg">Загрузка станций...</p>
              </div>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-12 text-center">
              <div className="text-gray-400 mb-4">
                <SlidersHorizontal size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  {searchQuery 
                    ? `Не найдено станций по запросу "${searchQuery}"`
                    : stations.length === 0 
                    ? 'Станций пока нет' 
                    : 'Нет станций, соответствующих фильтрам'}
                </p>
                <p className="text-sm mt-2">
                  {searchQuery
                    ? 'Попробуйте изменить поисковый запрос'
                    : stations.length === 0 
                    ? 'Администратор еще не добавил зарядные станции' 
                    : 'Попробуйте изменить параметры фильтрации'}
                </p>
              </div>
              {(stations.length > 0 && !searchQuery) && (
                <button
                  onClick={() => setShowFilter(true)}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Изменить фильтры
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Очистить поиск
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {filteredStations.map((station) => {
                // Найдем расстояние для станции, если она в списке ближайших
                const stationWithDistance = nearbyStations.find(s => s.id === station.id);
                const distance = stationWithDistance?.distance;
                
                return (
                  <div
                    key={station.id}
                    className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6 hover:border-emerald-500/50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedStation(station);
                      setActiveTab('map');
                      if (map.current) {
                        map.current.flyTo({
                          center: [station.longitude, station.latitude],
                          zoom: 16,
                        });
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{station.name}</h3>
                        <p className="text-gray-400 text-sm">{station.address}</p>
                        {distance && (
                          <p className="text-blue-400 text-sm font-medium mt-1">
                            📍 {distance.toFixed(1)} км от вас
                          </p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                        {getStatusText(station.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#0a1f1a] rounded-lg p-2 text-center">
                        <div className="text-gray-400 text-xs mb-1">Мощность</div>
                        <div className="text-white font-medium text-sm">{station.maxPowerKw} кВт</div>
                      </div>
                      <div className="bg-[#0a1f1a] rounded-lg p-2 text-center">
                        <div className="text-gray-400 text-xs mb-1">Коннектор</div>
                        <div className="text-white font-medium text-sm">{station.connectorType}</div>
                      </div>
                      <div className="bg-[#0a1f1a] rounded-lg p-2 text-center">
                        <div className="text-gray-400 text-xs mb-1">Цена</div>
                        <div className="text-emerald-400 font-medium text-sm">{station.pricePerMinute} сом/мин</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Balance View */}
      {activeTab === 'balance' && (
        <div className="flex-1 w-full overflow-y-auto p-4 pb-24">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Баланс</h2>
            
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 mb-6 shadow-xl">
              <div className="text-white/80 text-sm mb-2">Текущий баланс</div>
              <div className="text-white text-5xl font-bold mb-4">{userBalance.toFixed(2)} сом</div>
              <button className="bg-white text-emerald-600 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition">
                Пополнить баланс
              </button>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Последние операции</h3>
              <div className="text-gray-400 text-center py-8">
                История операций пуста
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Фильтры</h2>
              <button
                onClick={() => setShowFilter(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Station Type */}
              <div>
                <label className="block text-white font-medium mb-3">Тип станции:</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const newTypes = filters.stationType.includes('slow')
                        ? filters.stationType.filter(t => t !== 'slow')
                        : [...filters.stationType, 'slow'];
                      setFilters({ ...filters, stationType: newTypes });
                    }}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition ${
                      filters.stationType.includes('slow')
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-[#0a1f1a] border-emerald-900/30 text-gray-400'
                    }`}
                  >
                    медленная
                  </button>
                  <button
                    onClick={() => {
                      const newTypes = filters.stationType.includes('fast')
                        ? filters.stationType.filter(t => t !== 'fast')
                        : [...filters.stationType, 'fast'];
                      setFilters({ ...filters, stationType: newTypes });
                    }}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition ${
                      filters.stationType.includes('fast')
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-[#0a1f1a] border-emerald-900/30 text-gray-400'
                    }`}
                  >
                    быстрая
                  </button>
                  <button
                    onClick={() => {
                      const newTypes = filters.stationType.includes('ultra')
                        ? filters.stationType.filter(t => t !== 'ultra')
                        : [...filters.stationType, 'ultra'];
                      setFilters({ ...filters, stationType: newTypes });
                    }}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition ${
                      filters.stationType.includes('ultra')
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-[#0a1f1a] border-emerald-900/30 text-gray-400'
                    }`}
                  >
                    ультра
                  </button>
                </div>
              </div>

              {/* Connector Type */}
              <div>
                <label className="block text-white font-medium mb-3">Тип разъема:</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const newTypes = filters.connectorType.includes('CCS2')
                        ? filters.connectorType.filter(t => t !== 'CCS2')
                        : [...filters.connectorType, 'CCS2'];
                      setFilters({ ...filters, connectorType: newTypes });
                    }}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition ${
                      filters.connectorType.includes('CCS2')
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-[#0a1f1a] border-emerald-900/30 text-gray-400'
                    }`}
                  >
                    CCS2
                  </button>
                  <button
                    onClick={() => {
                      const newTypes = filters.connectorType.includes('CHAdeMO')
                        ? filters.connectorType.filter(t => t !== 'CHAdeMO')
                        : [...filters.connectorType, 'CHAdeMO'];
                      setFilters({ ...filters, connectorType: newTypes });
                    }}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition ${
                      filters.connectorType.includes('CHAdeMO')
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-[#0a1f1a] border-emerald-900/30 text-gray-400'
                    }`}
                  >
                    CHAdeMO
                  </button>
                  <button
                    onClick={() => {
                      const newTypes = filters.connectorType.includes('Type2')
                        ? filters.connectorType.filter(t => t !== 'Type2')
                        : [...filters.connectorType, 'Type2'];
                      setFilters({ ...filters, connectorType: newTypes });
                    }}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition ${
                      filters.connectorType.includes('Type2')
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-[#0a1f1a] border-emerald-900/30 text-gray-400'
                    }`}
                  >
                    Type 2
                  </button>
                </div>
              </div>

              {/* Power Range */}
              <div>
                <label className="block text-white font-medium mb-3">Мощность (кВт)</label>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Минимум</span>
                      <span className="text-emerald-400 font-bold">{filters.minPower} кВт</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="250"
                      step="10"
                      value={filters.minPower}
                      onChange={(e) => setFilters({ ...filters, minPower: parseInt(e.target.value) })}
                      className="w-full h-2 bg-[#0a1f1a] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Максимум</span>
                      <span className="text-emerald-400 font-bold">{filters.maxPower} кВт</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="250"
                      step="10"
                      value={filters.maxPower}
                      onChange={(e) => setFilters({ ...filters, maxPower: parseInt(e.target.value) })}
                      className="w-full h-2 bg-[#0a1f1a] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowFilter(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-lg font-medium transition"
              >
                Применить
              </button>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setFilters({
                    stationType: [],
                    connectorType: [],
                    minPower: 20,
                    maxPower: 250,
                  });
                }}
                className="w-full bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-gray-400 py-3 rounded-lg font-medium transition border border-emerald-900/30"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f2d26] border-t border-emerald-900/30 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            {/* Map */}
            <button
              onClick={() => setActiveTab('map')}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className={`p-2 rounded-lg transition ${
                activeTab === 'map' ? 'bg-emerald-500/20' : ''
              }`}>
                <MapPin 
                  size={24} 
                  className={activeTab === 'map' ? 'text-emerald-400' : 'text-gray-400'}
                />
              </div>
              <span className={`text-xs ${
                activeTab === 'map' ? 'text-emerald-400 font-medium' : 'text-gray-400'
              }`}>
                Карта
              </span>
            </button>

            {/* List */}
            <button
              onClick={() => setActiveTab('list')}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className={`p-2 rounded-lg transition ${
                activeTab === 'list' ? 'bg-emerald-500/20' : ''
              }`}>
                <List 
                  size={24} 
                  className={activeTab === 'list' ? 'text-emerald-400' : 'text-gray-400'}
                />
              </div>
              <span className={`text-xs ${
                activeTab === 'list' ? 'text-emerald-400 font-medium' : 'text-gray-400'
              }`}>
                Список
              </span>
            </button>

            {/* Balance */}
            <button
              onClick={() => setActiveTab('balance')}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className={`p-2 rounded-lg transition ${
                activeTab === 'balance' ? 'bg-emerald-500/20' : ''
              }`}>
                <Wallet 
                  size={24} 
                  className={activeTab === 'balance' ? 'text-emerald-400' : 'text-gray-400'}
                />
              </div>
              <span className={`text-xs ${
                activeTab === 'balance' ? 'text-emerald-400 font-medium' : 'text-gray-400'
              }`}>
                Баланс
              </span>
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push('/profile')}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className="p-2 rounded-lg transition">
                <User 
                  size={24} 
                  className="text-gray-400"
                />
              </div>
              <span className="text-xs text-gray-400">
                Профиль
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
