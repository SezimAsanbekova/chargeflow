'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sheet } from 'react-modal-sheet';
import { Maximize2, Navigation, Plus, Minus, X, MapPin, List, Wallet, User, SlidersHorizontal, Route, Clock, MapPinned, Search, Home, History, MoreHorizontal, Zap, Plug, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'balance' | 'history' | 'more'>('map');
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
  const [isCharging, setIsCharging] = useState(false);
  const [chargingStartTime, setChargingStartTime] = useState<number | null>(null);
  const [chargingStationId, setChargingStationId] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStation, setBookingStation] = useState<Station | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<15 | 30 | 60>(30);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Проверка на клиентскую сторону для избежания hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Функция для определения типа станции по мощности
  const getStationType = (powerKw: number): string => {
    if (powerKw < 50) return 'slow';
    if (powerKw < 150) return 'fast';
    return 'ultra';
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

  // Подсчет активных фильтров
  const activeFiltersCount = 
    filters.connectorType.length + 
    (filters.minPower !== 20 || filters.maxPower !== 250 ? 1 : 0);

  // Фильтрация станций с использованием useMemo
  const filteredStations = useMemo(() => {
    let stationsToFilter = stations;
    
    // Исключаем станции на обслуживании - пользователям их не показываем
    stationsToFilter = stationsToFilter.filter(station => station.status !== 'maintenance');
    
    // Применяем поиск по названию и адресу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      stationsToFilter = stationsToFilter.filter((station) => {
        const matchesName = station.name.toLowerCase().includes(query);
        const matchesAddress = station.address.toLowerCase().includes(query);
        return matchesName || matchesAddress;
      });
    }
    
    // Если есть местоположение пользователя, сортируем по расстоянию
    if (userLocation) {
      const stationsWithDistance = stationsToFilter.map(station => {
        const distance = calculateDistance(
          userLocation[1], // lat
          userLocation[0], // lng
          station.latitude,
          station.longitude
        );
        return { ...station, distance };
      });
      
      // Сортируем по расстоянию (ближайшие первыми)
      return stationsWithDistance.sort((a, b) => a.distance - b.distance);
    }
    
    // Если нет местоположения, возвращаем как есть
    return stationsToFilter;
  }, [stations, searchQuery, userLocation]);

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
    if (!isClient || stations.length === 0 || !userLocation || showOnlyNearby) return;
    
    // Добавляем небольшую задержку, чтобы карта успела инициализироваться
    const timer = setTimeout(() => {
      findNearbyStationsAutomatically(userLocation[1], userLocation[0]); // lat, lng
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isClient, stations, userLocation, showOnlyNearby]);

  // Обновляем индикатор зарядки каждую минуту
  useEffect(() => {
    if (!isClient || !isCharging || !chargingStartTime) return;

    const interval = setInterval(() => {
      // Принудительно обновляем компонент для отображения актуального времени и стоимости
      setChargingStartTime(chargingStartTime);
    }, 60000); // Каждую минуту

    return () => clearInterval(interval);
  }, [isClient, isCharging, chargingStartTime]);

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

  // Получаем местоположение пользователя
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Более детальная обработка ошибок геолокации
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.log('Пользователь запретил доступ к геолокации');
              break;
            case error.POSITION_UNAVAILABLE:
              console.log('Информация о местоположении недоступна');
              break;
            case error.TIMEOUT:
              console.log('Время ожидания геолокации истекло');
              break;
            default:
              console.log('Неизвестная ошибка геолокации');
              break;
          }
          // Используем центр Бишкека по умолчанию
          setUserLocation([74.6057, 42.8746]);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Увеличиваем timeout
          maximumAge: 300000 // 5 минут
        }
      );
    } else {
      console.log('Геолокация не поддерживается браузером');
      setUserLocation([74.6057, 42.8746]);
    }
  }, []);

  // Функция для автоматического поиска ближайших станций при загрузке
  const findNearbyStationsAutomatically = (lat: number, lng: number) => {
    console.log('🔍 Автоматический поиск ближайших станций...');
    console.log('📍 Местоположение пользователя:', lat, lng);
    console.log('🏢 Всего станций:', stations.length);
    
    // Фильтруем только активные станции (исключаем обслуживание) и сортируем по расстоянию
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
          
          // Фильтруем только активные станции (исключаем обслуживание) и сортируем по расстоянию
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

  // Инициализация карты только когда вкладка карты активна и режим карты
  useEffect(() => {
    // Если не на клиенте, не на вкладке карты или не в режиме карты, не инициализируем
    if (!isClient || activeTab !== 'map' || viewMode !== 'map') return;
    
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
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
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

    // Добавляем обработку ошибок загрузки тайлов
    map.current.on('error', (e) => {
      console.warn('Map error (non-critical):', e);
      // Не показываем ошибку пользователю, так как это обычно временные проблемы с тайлами
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
  }, [isClient, activeTab, viewMode, userLocation]);

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
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

      // Цвет в зависимости от статуса - все темно-зеленые
      if (station.status === 'available') {
        el.style.backgroundColor = '#065f46'; // темно-зеленый для доступных
      } else if (station.status === 'busy') {
        el.style.backgroundColor = '#064e3b'; // еще более темно-зеленый для занятых
      } else {
        el.style.backgroundColor = '#052e16'; // самый темно-зеленый для обслуживания
      }

      // Создаем SVG иконку молнии
      const icon = document.createElement('div');
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="white" stroke="white" stroke-width="1" stroke-linejoin="round"/>
        </svg>
      `;
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      icon.style.justifyContent = 'center';
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

  // Функция для начала зарядки
  const startCharging = (station: Station) => {
    if (station.status !== 'available') {
      alert('Станция недоступна для зарядки');
      return;
    }

    // Проверяем баланс (минимум 50 сом для начала зарядки)
    if (userBalance < 50) {
      const topUpConfirm = confirm(
        `Недостаточно средств для начала зарядки!\n\n` +
        `Текущий баланс: ${userBalance.toFixed(2)} сом\n` +
        `Минимум для зарядки: 50 сом\n\n` +
        `Пополнить баланс сейчас?`
      );
      
      if (topUpConfirm) {
        setShowTopUpModal(true);
      }
      return;
    }

    const confirmStart = confirm(
      `Начать зарядку на станции "${station.name}"?\n\n` +
      `Мощность: ${station.maxPowerKw} кВт\n` +
      `Цена: ${station.pricePerMinute} сом/мин\n` +
      `Коннектор: ${station.connectorType}\n` +
      `Ваш баланс: ${userBalance.toFixed(2)} сом`
    );

    if (confirmStart) {
      setIsCharging(true);
      setChargingStartTime(Date.now());
      setChargingStationId(station.id);
      
      // Здесь можно добавить API вызов для начала зарядки
      // await fetch('/api/charging/start', { method: 'POST', body: JSON.stringify({ stationId: station.id }) });
      
      alert(`✅ Зарядка начата на станции "${station.name}"`);
    }
  };

  // Функция для завершения зарядки
  const stopCharging = () => {
    if (!chargingStartTime || !chargingStationId) return;

    const chargingDuration = (Date.now() - chargingStartTime) / 1000 / 60; // в минутах
    const selectedStation = stations.find(s => s.id === chargingStationId);
    
    if (selectedStation) {
      const cost = chargingDuration * selectedStation.pricePerMinute;
      
      const confirmStop = confirm(
        `Завершить зарядку?\n\n` +
        `⏱️ Время зарядки: ${Math.round(chargingDuration)} мин\n` +
        `💰 Стоимость: ${cost.toFixed(2)} сом\n` +
        `🔋 Станция: ${selectedStation.name}`
      );

      if (confirmStop) {
        // Списываем стоимость зарядки с баланса
        if (userBalance >= cost) {
          setUserBalance(prev => prev - cost);
        } else {
          alert('⚠️ Недостаточно средств на балансе для оплаты зарядки!');
          return;
        }
        
        setIsCharging(false);
        setChargingStartTime(null);
        setChargingStationId(null);
        
        // Здесь можно добавить API вызов для завершения зарядки
        // await fetch('/api/charging/stop', { method: 'POST', body: JSON.stringify({ stationId: chargingStationId }) });
        
        alert(
          `🎉 Зарядка завершена!\n\n` +
          `⏱️ Время: ${Math.round(chargingDuration)} мин\n` +
          `💰 Списано: ${cost.toFixed(2)} сом\n` +
          `💳 Остаток на балансе: ${(userBalance - cost).toFixed(2)} сом\n` +
          `🏢 Станция: ${selectedStation.name}`
        );
      }
    }
  };

  // Функция для пополнения баланса
  const topUpBalance = async (amount: number) => {
    setIsProcessingPayment(true);
    
    try {
      // Имитация процесса оплаты
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Обновляем баланс
      setUserBalance(prev => prev + amount);
      
      // Показываем успешное сообщение
      alert(`✅ Баланс успешно пополнен на ${amount} сом!\nНовый баланс: ${(userBalance + amount).toFixed(2)} сом`);
      
      // Закрываем модальное окно
      setShowTopUpModal(false);
      setSelectedAmount(null);
      setCustomAmount('');
      
    } catch (error) {
      alert('❌ Ошибка при пополнении баланса. Попробуйте еще раз.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Функция для обработки выбора суммы
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  // Функция для обработки кастомной суммы
  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  // Функция для подтверждения пополнения
  const confirmTopUp = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount <= 0) {
      alert('Введите корректную сумму для пополнения');
      return;
    }
    
    if (amount < 10) {
      alert('Минимальная сумма пополнения: 10 сом');
      return;
    }
    
    if (amount > 10000) {
      alert('Максимальная сумма пополнения: 10,000 сом');
      return;
    }
    
    const confirmPayment = confirm(
      `Пополнить баланс на ${amount} сом?\n\n` +
      `Текущий баланс: ${userBalance.toFixed(2)} сом\n` +
      `Новый баланс: ${(userBalance + amount).toFixed(2)} сом`
    );
    
    if (confirmPayment) {
      topUpBalance(amount);
    }
  };

  // Функции для бронирования
  const openBookingModal = (station: Station) => {
    setBookingStation(station);
    setShowBookingModal(true);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedDuration(30);
    setBookingSuccess(false);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingStation(null);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedDuration(30);
    setShowTimeSelector(false);
    setBookingSuccess(false);
    setCurrentBooking(null);
  };

  // Получить доступные даты (следующие 30 дней)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })
      });
    }
    
    return dates;
  };

  // Получить доступные временные слоты
  const getAvailableTimeSlots = () => {
    const slots = [];
    
    // Генерируем слоты с 8:00 до 22:00 с интервалом 30 минут
    for (let hour = 8; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  // Проверить доступность временного слота
  const isTimeSlotAvailable = (time: string, duration: number) => {
    // Здесь можно добавить логику проверки занятых слотов
    // Пока возвращаем true для всех слотов
    return true;
  };

  // Подтвердить бронирование
  const confirmBooking = async () => {
    if (!bookingStation || !selectedDate || !selectedTime) {
      alert('Пожалуйста, выберите дату и время');
      return;
    }

    if (userBalance < 100) {
      alert('Недостаточно средств для депозита (100 сом)');
      return;
    }

    setIsProcessingBooking(true);

    try {
      // Имитация процесса бронирования
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Списываем депозит
      setUserBalance(prev => prev - 100);

      // Создаем объект бронирования
      const booking = {
        id: Date.now().toString(),
        station: bookingStation,
        date: selectedDate,
        time: selectedTime,
        duration: selectedDuration,
        deposit: 100,
        createdAt: new Date().toISOString()
      };

      setCurrentBooking(booking);
      setBookingSuccess(true);

    } catch (error) {
      alert('❌ Ошибка при создании бронирования. Попробуйте еще раз.');
    } finally {
      setIsProcessingBooking(false);
    }
  };

  // Функция для расчета времени окончания
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + duration);
    return endDate.toTimeString().slice(0, 5);
  };

  // Отменить бронирование
  const cancelBooking = () => {
    if (currentBooking) {
      const confirmCancel = confirm(
        `Отменить бронирование?\n\n` +
        `Депозит 100 сом будет возвращен на ваш баланс.`
      );

      if (confirmCancel) {
        // Возвращаем депозит
        setUserBalance(prev => prev + 100);
        
        alert('✅ Бронирование отменено. Депозит возвращен на ваш баланс.');
        closeBookingModal();
      }
    }
  };

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

  if (status === 'loading' || !userLocation || !isClient) {
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
      {/* Top View Mode Switcher - показывается только на вкладке карты */}
      {activeTab === 'map' && (
        <div className="absolute top-4 left-4 right-4 z-30 max-w-md mx-auto">
          <div className="bg-white rounded-full p-1 shadow-lg">
            <div className="flex">
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 py-3 px-8 rounded-full text-base font-medium transition ${
                  viewMode === 'map'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                На карте
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-3 px-8 rounded-full text-base font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Списком
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container - всегда в DOM, но скрывается через CSS */}
      <div 
        ref={mapContainer} 
        className={`flex-1 w-full ${viewMode === 'map' && activeTab === 'map' ? 'block' : 'hidden'}`}
      />

      {/* Map Overlays - показываются только на вкладке карты и в режиме карты */}
      {activeTab === 'map' && viewMode === 'map' && (
        <>
          {/* Active Charging Indicator */}
          {isCharging && chargingStartTime && (
            <div className="absolute top-4 left-4 right-4 z-20">
              <div className="bg-emerald-500 text-white rounded-2xl p-4 shadow-2xl max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">⚡ Идет зарядка</div>
                    <div className="text-emerald-100 text-sm">
                      {(() => {
                        if (!isClient || !chargingStartTime) return '0 мин • 0.00 сом • Станция';
                        const station = stations.find(s => s.id === chargingStationId);
                        const duration = Math.floor((Date.now() - chargingStartTime) / 1000 / 60);
                        const cost = station ? duration * station.pricePerMinute : 0;
                        return `${duration} мин • ${cost.toFixed(2)} сом • ${station?.name || 'Станция'}`;
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={stopCharging}
                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

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
          <div className="absolute right-4 top-80 z-10 flex flex-col gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilter(true)}
              className="w-12 h-12 bg-emerald-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-emerald-700 transition relative"
            >
              <SlidersHorizontal size={24} className="text-white" />
              {activeFiltersCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-emerald-900 text-xs font-bold">{activeFiltersCount}</span>
                </div>
              )}
            </button>
            
            <button
              onClick={handleZoomIn}
              className="w-12 h-12 bg-emerald-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-emerald-700 transition"
            >
              <Plus size={24} className="text-white" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-12 h-12 bg-emerald-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-emerald-700 transition"
            >
              <Minus size={24} className="text-white" />
            </button>
            <button
              onClick={handleGoToUserLocation}
              className="w-12 h-12 bg-emerald-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-emerald-700 transition"
            >
              <Navigation size={24} className="text-white" />
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
                          {isClient && tripStartTime ? Math.floor((Date.now() - tripStartTime) / 1000 / 60) : 0} мин в пути
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
                    className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/30"
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
                      className="w-full bg-emerald-800 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/30"
                    >
                      <Navigation size={20} />
                      <span>Начать поездку</span>
                    </button>
                    <button
                      onClick={clearRoute}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-medium transition"
                    >
                      Очистить маршрут
                    </button>
                  </>
                )}
                
                {/* Кнопка начать зарядку - показывается только если пользователь не заряжается */}
                {!isCharging && (
                  <button
                    onClick={() => startCharging(selectedStation)}
                    disabled={selectedStation.status !== 'available'}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2"
                  >
                    <Zap size={20} />
                    <span>{selectedStation.status === 'available' ? 'Начать зарядку' : 'Недоступно'}</span>
                  </button>
                )}
                
                {/* Кнопка завершить зарядку - показывается только если пользователь заряжается на этой станции */}
                {isCharging && chargingStationId === selectedStation.id && (
                  <button
                    onClick={stopCharging}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    <Plug size={20} />
                    <span>Завершить зарядку</span>
                  </button>
                )}
                
                <button
                  onClick={() => openBookingModal(selectedStation)}
                  disabled={selectedStation.status !== 'available' || isCharging}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition shadow-lg shadow-blue-600/30"
                >
                  {selectedStation.status === 'available' ? 'Забронировать' : 'Недоступно'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* List View */}
      {(activeTab === 'list' || (activeTab === 'map' && viewMode === 'list')) && (
        <div className="flex-1 w-full overflow-y-auto p-4 pb-24">
          {/* Active Charging Indicator */}
          {isCharging && chargingStartTime && (
            <div className="max-w-2xl mx-auto mb-4 bg-emerald-500 text-white rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="font-bold text-lg">⚡ Идет зарядка</div>
                  <div className="text-emerald-100 text-sm">
                    {(() => {
                      if (!isClient || !chargingStartTime) return '0 мин • 0.00 сом • Станция';
                      const station = stations.find(s => s.id === chargingStationId);
                      const duration = Math.floor((Date.now() - chargingStartTime) / 1000 / 60);
                      const cost = station ? duration * station.pricePerMinute : 0;
                      return `${duration} мин • ${cost.toFixed(2)} сом • ${station?.name || 'Станция'}`;
                    })()}
                  </div>
                </div>
                <button
                  onClick={stopCharging}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Зарядные станции
          </h2>
          
          {/* Search Bar Only */}
          <div className="max-w-2xl mx-auto mb-6 mt-10">
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
                    : 'Станций пока нет'}
                </p>
                <p className="text-sm mt-2">
                  {searchQuery
                    ? 'Попробуйте изменить поисковый запрос'
                    : 'Администратор еще не добавил зарядные станции'}
                </p>
              </div>
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
                // Вычисляем расстояние до станции если есть местоположение пользователя
                let distance = null;
                if (userLocation) {
                  distance = calculateDistance(
                    userLocation[1], // lat
                    userLocation[0], // lng
                    station.latitude,
                    station.longitude
                  );
                }
                
                return (
                  <div
                    key={station.id}
                    className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6 hover:border-emerald-500/50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedStation(station);
                      setViewMode('map');
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
                      </div>
                      <div className="flex items-center gap-2">
                        {distance && (
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <MapPin size={16} />
                            <span>{distance.toFixed(1)} км</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-gray-400 text-sm">
                      <span>Мощность: {station.maxPowerKw} кВт</span>
                      <span className="ml-4">Коннектор: {station.connectorType}</span>
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
            <div className={`rounded-2xl p-8 mb-6 shadow-xl ${
              userBalance < 50 
                ? 'bg-gradient-to-br from-red-500 to-red-600' 
                : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
            }`}>
              <div className="text-white/80 text-sm mb-2">Текущий баланс</div>
              <div className="text-white text-5xl font-bold mb-2">{userBalance.toFixed(2)} сом</div>
              {userBalance < 50 && (
                <div className="text-white/90 text-sm mb-4 bg-white/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>Низкий баланс! Пополните для продолжения зарядки</span>
                </div>
              )}
              <button 
                onClick={() => setShowTopUpModal(true)}
                className="bg-white text-emerald-600 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition"
              >
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

      {/* Filter Bottom Sheet */}
      <Sheet 
        isOpen={showFilter} 
        onClose={() => setShowFilter(false)}
        snapPoints={[0, 0.6, 1]}
        initialSnap={1}
      >
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>
            <div className="px-6 pb-6 bg-[#0f2d26]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white text-center">Фильтры</h2>
              </div>

              <div className="space-y-6">
                {/* Connector Type */}
                <div>
                  <label className="block text-white font-medium mb-3 text-center">Тип разъема:</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        const newTypes = filters.connectorType.includes('CCS2')
                          ? filters.connectorType.filter(t => t !== 'CCS2')
                          : [...filters.connectorType, 'CCS2'];
                        setFilters({ ...filters, connectorType: newTypes });
                      }}
                      className={`py-3 px-2 rounded-lg border-2 transition text-sm font-medium ${
                        filters.connectorType.includes('CCS2')
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#0a1f1a] border-emerald-900/30 text-white hover:border-emerald-500/50'
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
                      className={`py-3 px-2 rounded-lg border-2 transition text-sm font-medium ${
                        filters.connectorType.includes('CHAdeMO')
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#0a1f1a] border-emerald-900/30 text-white hover:border-emerald-500/50'
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
                      className={`py-3 px-2 rounded-lg border-2 transition text-sm font-medium ${
                        filters.connectorType.includes('Type2')
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#0a1f1a] border-emerald-900/30 text-white hover:border-emerald-500/50'
                      }`}
                    >
                      Type 2
                    </button>
                  </div>
                </div>

                {/* Power Range */}
                <div>
                  <label className="block text-white font-medium mb-3 text-center">Мощность зарядки</label>
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

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowFilter(false)}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition shadow-lg"
                  >
                    Применить
                  </button>

                  <button
                    onClick={() => {
                      setFilters({
                        stationType: [],
                        connectorType: [],
                        minPower: 20,
                        maxPower: 250,
                      });
                    }}
                    className="bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-white py-3 rounded-xl font-medium transition border border-emerald-900/30"
                  >
                    Сбросить
                  </button>
                </div>
              </div>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Пополнить счет</h2>
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setSelectedAmount(null);
                  setCustomAmount('');
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Current Balance */}
            <div className="bg-[#0a1f1a] rounded-xl p-4 mb-6 text-center">
              <div className="text-gray-400 text-sm mb-1">Текущий баланс:</div>
              <div className="text-white text-2xl font-bold">{userBalance.toFixed(2)} сом</div>
              {userBalance < 50 && (
                <div className="text-red-400 text-xs mt-1 px-3 py-1 bg-red-500/20 rounded-full inline-block">
                  Требуется пополнение
                </div>
              )}
            </div>

            {/* Quick Amount Selection */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-4">Пополнить счет</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[100, 200, 300, 500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`py-3 px-4 rounded-lg border-2 transition font-medium ${
                      selectedAmount === amount
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-[#0a1f1a] border-emerald-900/30 text-gray-400 hover:border-emerald-500/50'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              
              {/* Selected Amount Display */}
              {selectedAmount && (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-emerald-400">{selectedAmount} сом</div>
                  <div className="text-gray-400 text-sm">
                    Минимальная сумма пополнения — {selectedAmount} сом
                  </div>
                </div>
              )}
            </div>

            {/* Custom Amount Input */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">Или введите сумму:</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Введите сумму"
                min="10"
                max="10000"
                className="w-full px-4 py-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
              />
              {customAmount && (
                <div className="text-center mt-2">
                  <div className="text-2xl font-bold text-emerald-400">{customAmount} сом</div>
                </div>
              )}
            </div>

            {/* Payment Button */}
            <button
              onClick={confirmTopUp}
              disabled={(!selectedAmount && !customAmount) || isProcessingPayment}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Обработка платежа...</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span>Пополнить</span>
                </>
              )}
            </button>

            {/* Payment Info */}
            <div className="mt-4 text-center text-gray-400 text-xs">
              <p>Минимальная сумма: 10 сом</p>
              <p>Максимальная сумма: 10,000 сом</p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && bookingStation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {!bookingSuccess ? (
              <>
                {/* Booking Form */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Бронирование</h2>
                  <button
                    onClick={closeBookingModal}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Station Info */}
                <div className="bg-[#0a1f1a] rounded-xl p-4 mb-6">
                  <h3 className="text-white font-bold text-lg mb-1">{bookingStation.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{bookingStation.address}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Мощность:</span>
                      <span className="text-white ml-2">{bookingStation.maxPowerKw} кВт</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Цена:</span>
                      <span className="text-emerald-400 ml-2">{bookingStation.pricePerMinute} сом/мин</span>
                    </div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="mb-6">
                  <label className="block text-white font-medium mb-3">Выберите дату:</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Выберите дату</option>
                    {getAvailableDates().map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Selection */}
                <div className="mb-6">
                  <label className="block text-white font-medium mb-3">Выберите время:</label>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowTimeSelector(!showTimeSelector)}
                      className="w-full px-4 py-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg text-left text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {selectedTime ? `${selectedTime} (${selectedDuration} мин)` : 'Выберите время'}
                    </button>
                    
                    {showTimeSelector && (
                      <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-lg p-4">
                        {/* Duration Selection */}
                        <div className="mb-4">
                          <label className="block text-white text-sm font-medium mb-2">Продолжительность:</label>
                          <div className="flex gap-2">
                            {[15, 30, 60].map((duration) => (
                              <button
                                key={duration}
                                onClick={() => setSelectedDuration(duration as 15 | 30 | 60)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                  selectedDuration === duration
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-[#0f2d26] text-gray-400 hover:text-white'
                                }`}
                              >
                                {duration} мин
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Time Slots */}
                        <div className="mb-2">
                          <div className="text-white text-sm font-medium mb-2">
                            Доступные слоты ({getAvailableTimeSlots().filter(time => isTimeSlotAvailable(time, selectedDuration)).length}):
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                          {getAvailableTimeSlots().map((time) => (
                            <button
                              key={time}
                              onClick={() => {
                                setSelectedTime(time);
                                setShowTimeSelector(false);
                              }}
                              disabled={!isTimeSlotAvailable(time, selectedDuration)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                selectedTime === time
                                  ? 'bg-emerald-500 text-white'
                                  : isTimeSlotAvailable(time, selectedDuration)
                                  ? 'bg-[#0f2d26] text-gray-400 hover:text-white hover:bg-emerald-500/20'
                                  : 'bg-gray-600 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deposit Info */}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="text-white font-medium">Информация о депозите</span>
                  </div>
                  <p className="text-yellow-100 text-sm">
                    Депозит составляет 100 сом и будет списан с вашего баланса при подтверждении бронирования.
                  </p>
                </div>

                {/* Balance Info */}
                <div className="bg-[#0a1f1a] rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Текущий баланс:</span>
                    <span className={`font-bold ${userBalance >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {userBalance.toFixed(2)} сом
                    </span>
                  </div>
                  {userBalance < 100 && (
                    <div className="mt-2 text-red-400 text-sm flex items-center gap-1">
                      <AlertTriangle size={14} />
                      <span>Недостаточно средств для депозита</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {userBalance < 100 && (
                    <button
                      onClick={() => {
                        closeBookingModal();
                        setShowTopUpModal(true);
                      }}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition"
                    >
                      Пополнить баланс
                    </button>
                  )}
                  
                  <button
                    onClick={confirmBooking}
                    disabled={!selectedDate || !selectedTime || userBalance < 100 || isProcessingBooking}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    {isProcessingBooking ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Создание брони...</span>
                      </>
                    ) : (
                      'Подтвердить бронь'
                    )}
                  </button>
                  
                  <button
                    onClick={closeBookingModal}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition"
                  >
                    Назад
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Booking Success */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-emerald-400" size={48} />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-6">Бронирование успешно!</h2>
                  
                  <div className="bg-[#0a1f1a] rounded-xl p-6 mb-6 text-left">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Станция:</span>
                        <span className="text-white font-medium">{currentBooking?.station.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Дата:</span>
                        <span className="text-white font-medium">
                          {new Date(currentBooking?.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Время:</span>
                        <span className="text-white font-medium">
                          {currentBooking?.time} – {calculateEndTime(currentBooking?.time, currentBooking?.duration)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Списано:</span>
                        <span className="text-red-400 font-medium">100 сом (депозит)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                    <p className="text-blue-100 text-sm">
                      Отменить бронь можно не позднее чем за 30 минут до начала
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        closeBookingModal();
                        // Здесь можно добавить логику для начала зарядки
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-lg font-semibold transition"
                    >
                      Начать зарядку
                    </button>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={cancelBooking}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition"
                      >
                        Отменить бронь
                      </button>
                      
                      <button
                        onClick={closeBookingModal}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition"
                      >
                        На главную
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f2d26] border-t border-emerald-900/30 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {/* Главная */}
            <button
              onClick={() => {
                setActiveTab('map');
                setViewMode('map');
              }}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className={`p-2 rounded-lg transition ${
                activeTab === 'map' ? 'bg-emerald-500/20' : ''
              }`}>
                <Home 
                  size={24} 
                  className={activeTab === 'map' ? 'text-emerald-400' : 'text-white'}
                />
              </div>
              <span className={`text-xs ${
                activeTab === 'map' ? 'text-emerald-400 font-medium' : 'text-white'
              }`}>
                Главная
              </span>
            </button>

            {/* Кошелек */}
            <button
              onClick={() => setActiveTab('balance')}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className={`p-2 rounded-lg transition ${
                activeTab === 'balance' ? 'bg-emerald-500/20' : ''
              }`}>
                <Wallet 
                  size={24} 
                  className={activeTab === 'balance' ? 'text-emerald-400' : 'text-white'}
                />
              </div>
              <span className={`text-xs ${
                activeTab === 'balance' ? 'text-emerald-400 font-medium' : 'text-white'
              }`}>
                Кошелек
              </span>
            </button>

            {/* История */}
            <button
              onClick={() => router.push('/bookings')}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className="p-2 rounded-lg transition">
                <History 
                  size={24} 
                  className="text-white"
                />
              </div>
              <span className="text-xs text-white">
                История
              </span>
            </button>

            {/* Еще */}
            <button
              onClick={() => router.push('/profile')}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className="p-2 rounded-lg transition">
                <MoreHorizontal 
                  size={24} 
                  className="text-white"
                />
              </div>
              <span className="text-xs text-white">
                Еще
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
