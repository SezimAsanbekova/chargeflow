'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sheet } from 'react-modal-sheet';
import { Maximize2, Navigation, Plus, Minus, X, MapPin, List, Wallet, User, SlidersHorizontal, Route, Clock, MapPinned, Search, Home, History, MoreHorizontal, Zap, Plug, CheckCircle, AlertTriangle } from 'lucide-react';
import { NavigationPanel } from './components/NavigationPanel';
import { NavigationSimulator } from './components/NavigationSimulator';
import { SimulationControls } from './components/SimulationControls';
import { getVoiceNavigator } from './utils/voiceNavigator';

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
  connectors?: Array<{
    id: string;
    type: string;
    powerKw: number;
    pricePerKwh: number;
    pricePerMinute?: number;
    status: string;
  }>;
}

export default function MapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<{
    id: string;
    type: string;
    powerKw: number;
    pricePerKwh: number;
    pricePerMinute?: number;
    status: string;
  } | null>(null);
  const [showStationSheet, setShowStationSheet] = useState(false);

  // Функция для открытия станции в bottom sheet
  const openStationSheet = (station: Station) => {
    setSelectedStation(station);
    // Автоматически выбираем первый доступный коннектор
    const availableConnector = station.connectors?.find(c => c.status === 'available');
    setSelectedConnector(availableConnector || station.connectors?.[0] || null);
    setShowStationSheet(true);
  };

  // Функция для закрытия станции
  const closeStationSheet = () => {
    setShowStationSheet(false);
    // Задержка перед очисткой данных для плавной анимации
    setTimeout(() => {
      setSelectedStation(null);
      setSelectedConnector(null);
      clearRoute();
    }, 300);
  };
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
  
  // Новые состояния для симуляции навигации
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(100); // км/ч
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [simulatedPosition, setSimulatedPosition] = useState<[number, number] | null>(null);
  const [simulatedBearing, setSimulatedBearing] = useState(0);
  const [distanceToCurrentStep, setDistanceToCurrentStep] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const simulatedMarkerRef = useRef<maplibregl.Marker | null>(null);
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
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showConnectorDropdown, setShowConnectorDropdown] = useState(false);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // Состояния для фильтрации по активному автомобилю
  const [activeVehicle, setActiveVehicle] = useState<{
    id: string;
    brand: string;
    model: string;
    connectorType: string;
    maxPowerKw: number;
  } | null>(null);
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(false);

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

  // Функция для форматирования типа коннектора
  const formatConnectorType = (type: string): string => {
    if (type === 'GB_T') return 'GB/T';
    return type;
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
    
    // Фильтр по совместимости с активным автомобилем
    if (showOnlyCompatible && activeVehicle) {
      stationsToFilter = stationsToFilter.filter((station) => {
        // Проверяем, есть ли у станции коннектор, совместимый с автомобилем
        if (station.connectors && station.connectors.length > 0) {
          return station.connectors.some(connector => 
            connector.type === activeVehicle.connectorType
          );
        }
        // Если нет массива connectors, проверяем основной тип
        return station.connectorType === activeVehicle.connectorType;
      });
    }
    
    // Применяем поиск по названию и адресу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      stationsToFilter = stationsToFilter.filter((station) => {
        const matchesName = station.name.toLowerCase().includes(query);
        const matchesAddress = station.address.toLowerCase().includes(query);
        return matchesName || matchesAddress;
      });
    }
    
    // Фильтр по типу разъема
    if (filters.connectorType.length > 0) {
      stationsToFilter = stationsToFilter.filter((station) => {
        // Проверяем основной тип разъема станции
        if (filters.connectorType.includes(station.connectorType)) {
          return true;
        }
        // Также проверяем разъемы в массиве connectors, если они есть
        if (station.connectors && station.connectors.length > 0) {
          return station.connectors.some(connector => 
            filters.connectorType.includes(connector.type)
          );
        }
        return false;
      });
    }
    
    // Фильтр по мощности
    stationsToFilter = stationsToFilter.filter((station) => {
      return station.maxPowerKw >= filters.minPower && station.maxPowerKw <= filters.maxPower;
    });
    
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
  }, [stations, searchQuery, userLocation, filters, showOnlyCompatible, activeVehicle]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showConnectorDropdown && !target.closest('.connector-dropdown-container')) {
        setShowConnectorDropdown(false);
      }
    };

    if (showConnectorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConnectorDropdown]);

  // Загружаем станции из API
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setIsLoadingStations(true);
        const response = await fetch('/api/stations');
        if (response.ok) {
          const data = await response.json();
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

  // Загружаем активный автомобиль пользователя
  useEffect(() => {
    const fetchActiveVehicle = async () => {
      try {
        const response = await fetch('/api/vehicles');
        if (response.ok) {
          const data = await response.json();
          const active = data.vehicles?.find((v: any) => v.isActive);
          if (active) {
            setActiveVehicle({
              id: active.id,
              brand: active.brand,
              model: active.model,
              connectorType: active.connectorType,
              maxPowerKw: active.maxPowerKw,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching active vehicle:', error);
      }
    };

    if (session) {
      fetchActiveVehicle();
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
      setUserLocation([74.6057, 42.8746]);
    }
  }, []);

  // Функция для автоматического поиска ближайших станций при загрузке
  const findNearbyStationsAutomatically = (lat: number, lng: number) => {
    // Фильтруем только активные станции (исключаем обслуживание) и сортируем по расстоянию
    const activeStations = stations.filter(station => station.status === 'available');
    
    const stationsWithDistance = activeStations.map(station => {
      const distance = calculateDistance(lat, lng, station.latitude, station.longitude);
      return { ...station, distance };
    });
    
    // Сортируем по расстоянию и берем ближайшие (в радиусе 15 км)
    const nearbyStations = stationsWithDistance
      .filter(station => station.distance <= 15) // Увеличиваем радиус до 15 км для автоматического поиска
      .sort((a, b) => a.distance - b.distance);
    
    if (nearbyStations.length > 0) {
      // Устанавливаем ближайшие станции и включаем режим "только ближайшие"
      setNearbyStations(nearbyStations);
      setShowOnlyNearby(true);
      
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
      }, 100);
      return;
    }

    // Инициализируем карту
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
      // Игнорируем некритичные ошибки загрузки тайлов
    });

    // Ждём загрузки карты
    map.current.on('load', () => {
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

    // Удаляем все существующие маркеры станций
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Добавляем маркеры отфильтрованных станций
    filteredStations.forEach((station) => {
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
        openStationSheet(station);
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
      
      // Сохраняем координаты маршрута для симуляции
      setRouteCoordinates(coordinates);

      // Извлекаем пошаговые инструкции
      const steps = route.legs[0].steps.map((step: any, index: number) => {
        const bearingBefore = step.maneuver.bearing_before;
        const bearingAfter = step.maneuver.bearing_after;
        
        // Вычисляем угол поворота
        let turnAngle = bearingAfter - bearingBefore;
        if (turnAngle > 180) turnAngle -= 360;
        if (turnAngle < -180) turnAngle += 360;
        
        // Логируем для отладки
        console.log(`📍 Шаг ${index}: ${step.maneuver.type}`, {
          OSRM_modifier: step.maneuver.modifier,
          bearing_before: bearingBefore,
          bearing_after: bearingAfter,
          угол: `${Math.round(turnAngle)}°`,
          геометрический_поворот: turnAngle > 15 ? '➡️ ВПРАВО' : turnAngle < -15 ? '⬅️ ВЛЕВО' : '⬆️ ПРЯМО',
          улица: step.name,
          расстояние: `${Math.round(step.distance)}м`
        });

        // Используем ОРИГИНАЛЬНЫЕ направления от OSRM (без инверсии)
        let instruction = '';
        const modifier = step.maneuver.modifier;
        
        if (step.maneuver.type === 'depart') {
          instruction = 'Начните движение';
        } else if (step.maneuver.type === 'arrive') {
          instruction = 'Вы прибыли к месту назначения';
        } else if (step.maneuver.type === 'turn') {
          if (modifier === 'left') instruction = 'Поверните налево';
          else if (modifier === 'right') instruction = 'Поверните направо';
          else if (modifier === 'slight left') instruction = 'Поверните слегка налево';
          else if (modifier === 'slight right') instruction = 'Поверните слегка направо';
          else if (modifier === 'sharp left') instruction = 'Резко поверните налево';
          else if (modifier === 'sharp right') instruction = 'Резко поверните направо';
          else if (modifier === 'uturn') instruction = 'Развернитесь';
          else instruction = 'Поверните';
        } else if (step.maneuver.type === 'continue') {
          instruction = 'Продолжайте движение прямо';
        } else if (step.maneuver.type === 'roundabout' || step.maneuver.type === 'rotary') {
          instruction = 'Въезжайте на круговое движение';
        } else if (step.maneuver.type === 'merge') {
          instruction = 'Перестройтесь';
        } else if (step.maneuver.type === 'fork') {
          if (modifier === 'left') instruction = 'На развилке держитесь левее';
          else if (modifier === 'right') instruction = 'На развилке держитесь правее';
          else instruction = 'На развилке продолжайте движение';
        } else if (step.maneuver.type === 'end of road') {
          if (modifier === 'left') instruction = 'В конце дороги поверните налево';
          else if (modifier === 'right') instruction = 'В конце дороги поверните направо';
          else instruction = 'В конце дороги продолжайте движение';
        } else {
          instruction = 'Продолжайте движение';
        }

        return {
          instruction,
          distance: step.distance,
          duration: step.duration,
        };
      });

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
    stopSimulation();
    if (map.current && map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    setRouteInfo(null);
    setCurrentStepIndex(0);
    setRouteCoordinates([]);
  };

  const startNavigation = () => {
    if (!routeInfo || !selectedStation) return;
    
    setIsNavigating(true);
    setTripStartTime(Date.now());
    setCurrentStepIndex(0);

    // Объявляем начало навигации голосом
    const voiceNavigator = getVoiceNavigator();
    voiceNavigator.announceNavigationStart(selectedStation.name);

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
              pitch: 60,
            });
          }

          // Вычисляем текущий шаг и расстояние до него
          if (routeInfo && routeCoordinates.length > 0) {
            updateRealNavigationProgress(newLocation);
          }
        },
        (error) => {
          alert('Ошибка получения GPS координат. Проверьте разрешения.');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    }
  };

  // Функция для обновления прогресса реальной навигации
  const updateRealNavigationProgress = (currentPosition: [number, number]) => {
    if (!routeInfo) return;

    // Находим текущий шаг маршрута
    let accumulatedDistance = 0;
    let currentStepIdx = 0;
    
    for (let i = 0; i < routeInfo.steps.length; i++) {
      accumulatedDistance += routeInfo.steps[i].distance;
      
      // Вычисляем расстояние от текущей позиции до конца этого шага
      const distanceFromStart = calculateTotalDistanceTraveled(currentPosition);
      
      if (distanceFromStart < accumulatedDistance) {
        currentStepIdx = i;
        const distanceToStep = accumulatedDistance - distanceFromStart;
        
        setCurrentStepIndex(currentStepIdx);
        setDistanceToCurrentStep(distanceToStep);
        
        // Голосовые подсказки
        // ВАЖНО: маневр находится в НАЧАЛЕ шага. Пока едем в шаге N,
        // объявляем инструкцию ПРЕДСТОЯЩЕГО маневра — начало шага N+1
        const upcomingStepIdx = currentStepIdx + 1;
        if (upcomingStepIdx < routeInfo.steps.length) {
          const voiceNavigator = getVoiceNavigator();
          voiceNavigator.announceManeuver(
            upcomingStepIdx,
            routeInfo.steps[upcomingStepIdx].instruction,
            distanceToStep
          );
        }
        
        break;
      }
    }

    // Проверяем прибытие к станции
    if (selectedStation) {
      const distanceToStation = calculateDistance(
        currentPosition[1],
        currentPosition[0],
        selectedStation.latitude,
        selectedStation.longitude
      ) * 1000; // в метрах

      if (distanceToStation < 20) { // Прибыли если ближе 20 метров
        handleRealNavigationArrival();
      }
    }
  };

  // Вычисляем пройденное расстояние от начала маршрута
  const calculateTotalDistanceTraveled = (currentPosition: [number, number]): number => {
    if (!routeCoordinates.length || !userLocation) return 0;

    // Находим ближайшую точку на маршруте к текущей позиции
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < routeCoordinates.length; i++) {
      const dist = calculateDistance(
        currentPosition[1],
        currentPosition[0],
        routeCoordinates[i][1],
        routeCoordinates[i][0]
      ) * 1000;

      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    // Суммируем расстояние от начала до ближайшей точки
    let totalDistance = 0;
    for (let i = 0; i < closestIndex; i++) {
      if (i < routeCoordinates.length - 1) {
        totalDistance += calculateDistance(
          routeCoordinates[i][1],
          routeCoordinates[i][0],
          routeCoordinates[i + 1][1],
          routeCoordinates[i + 1][0]
        ) * 1000;
      }
    }

    return totalDistance;
  };

  // Обработка прибытия при реальной навигации
  const handleRealNavigationArrival = () => {
    if (!tripStartTime || !routeInfo || !selectedStation) return;

    const tripDuration = (Date.now() - tripStartTime) / 1000 / 60; // в минутах
    const estimatedDuration = routeInfo?.durationInTraffic || routeInfo?.duration || 0;

    // Объявляем прибытие голосом
    const voiceNavigator = getVoiceNavigator();
    voiceNavigator.announceArrival(selectedStation.name);

    alert(
      `🎉 Вы прибыли к станции!\n\n` +
      `📍 Расстояние: ${routeInfo.distance.toFixed(1)} км\n` +
      `⏱️ Время в пути: ${Math.round(tripDuration)} мин\n` +
      `📊 Запланировано: ${Math.round(estimatedDuration)} мин`
    );

    stopNavigation();
    setTripStartTime(null);
    clearRoute();
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setShowNavigationDetails(false);
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Новые функции для симуляции навигации
  const startSimulation = () => {
    if (!routeInfo || !routeCoordinates.length || !selectedStation) return;
    
    setIsSimulating(true);
    setIsSimulationPaused(false);
    setIsNavigating(true);
    setTripStartTime(Date.now());
    setCurrentStepIndex(0);
    setSimulatedPosition(routeCoordinates[0]);
    
    // Создаем маркер для симулированной позиции
    if (map.current && !simulatedMarkerRef.current) {
      const el = document.createElement('div');
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      
      // Иконка машины (вид сверху) с тенью
      const carIcon = document.createElement('div');
      carIcon.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#shadow)">
            <rect x="7" y="3" width="10" height="18" rx="2" fill="#3b82f6"/>
            <rect x="8.5" y="5" width="7" height="4" rx="1" fill="white" opacity="0.9"/>
            <rect x="8.5" y="13" width="7" height="3" rx="0.5" fill="white" opacity="0.9"/>
            <circle cx="9" cy="11" r="0.8" fill="#1f2937"/>
            <circle cx="15" cy="11" r="0.8" fill="#1f2937"/>
            <rect x="6.5" y="7" width="0.8" height="2" fill="#1f2937"/>
            <rect x="16.7" y="7" width="0.8" height="2" fill="#1f2937"/>
          </g>
          <defs>
            <filter id="shadow" x="-2" y="-2" width="28" height="28">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.5"/>
            </filter>
          </defs>
        </svg>
      `;
      carIcon.style.display = 'flex';
      carIcon.style.alignItems = 'center';
      carIcon.style.justifyContent = 'center';
      el.appendChild(carIcon);
      
      simulatedMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
        .setLngLat(routeCoordinates[0])
        .addTo(map.current);
    }
    
    // Центрируем карту на начало маршрута
    if (map.current) {
      map.current.flyTo({
        center: routeCoordinates[0],
        zoom: 17,
        pitch: 60,
      });
    }
  };

  const pauseSimulation = () => {
    setIsSimulationPaused(true);
  };

  const resumeSimulation = () => {
    setIsSimulationPaused(false);
  };

  const resetSimulation = () => {
    setCurrentStepIndex(0);
    setSimulatedPosition(routeCoordinates[0]);
    setDistanceToCurrentStep(routeInfo?.steps[0]?.distance || 0);
    
    if (simulatedMarkerRef.current && routeCoordinates[0]) {
      simulatedMarkerRef.current.setLngLat(routeCoordinates[0]);
    }
    
    if (map.current) {
      map.current.flyTo({
        center: routeCoordinates[0],
        zoom: 17,
        pitch: 60,
      });
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setIsSimulationPaused(false);
    setSimulatedPosition(null);
    setSimulatedBearing(0);
    setDistanceToCurrentStep(0);
    
    // Объявляем завершение навигации
    const voiceNavigator = getVoiceNavigator();
    voiceNavigator.announceNavigationEnd();
    voiceNavigator.reset();
    
    if (simulatedMarkerRef.current) {
      simulatedMarkerRef.current.remove();
      simulatedMarkerRef.current = null;
    }
  };

  const handleSimulationPositionUpdate = useCallback((position: [number, number], bearing: number) => {
    setSimulatedPosition(position);
    setSimulatedBearing(bearing);
    
    // Обновляем маркер
    if (simulatedMarkerRef.current) {
      simulatedMarkerRef.current.setLngLat(position);
      simulatedMarkerRef.current.setRotation(bearing);
    }
    
    // Карта следует за маркером
    if (map.current) {
      map.current.easeTo({
        center: position,
        bearing: bearing,
        duration: 100,
      });
    }
  }, []);

  const handleSimulationStepChange = useCallback((stepIndex: number, distanceToStep: number) => {
    setCurrentStepIndex(stepIndex);
    setDistanceToCurrentStep(distanceToStep);
  }, []);

  const handleSimulationArrival = useCallback(() => {
    setIsSimulating(false);
    setIsSimulationPaused(false);
    
    if (!tripStartTime || !routeInfo || !selectedStation) return;

    const tripDuration = (Date.now() - tripStartTime) / 1000 / 60; // в минутах
    const estimatedDuration = routeInfo?.durationInTraffic || routeInfo?.duration || 0;

    // Объявляем прибытие голосом
    const voiceNavigator = getVoiceNavigator();
    voiceNavigator.announceArrival(selectedStation.name);

    alert(
      `🎉 Вы прибыли к станции!\n\n` +
      `📍 Расстояние: ${routeInfo.distance.toFixed(1)} км\n` +
      `⏱️ Время в пути: ${Math.round(tripDuration)} мин\n` +
      `📊 Запланировано: ${Math.round(estimatedDuration)} мин`
    );

    stopSimulation();
    setIsNavigating(false);
    setTripStartTime(null);
    clearRoute();
  }, [tripStartTime, routeInfo, selectedStation]);

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
    // Проверяем, что выбран коннектор
    if (!selectedConnector) {
      alert('Выберите коннектор для зарядки');
      return;
    }

    if (selectedConnector.status !== 'available') {
      alert('Выбранный коннектор недоступен для зарядки');
      return;
    }

    // Перенаправляем на страницу подтверждения зарядки
    router.push(`/charging/confirm?stationId=${station.id}&connectorId=${selectedConnector.id}`);
  };

  // Функция для завершения зарядки
  const stopCharging = () => {
    if (!chargingStartTime || !chargingStationId) return;

    const chargingDuration = (Date.now() - chargingStartTime) / 1000 / 60; // в минутах
    const station = stations.find(s => s.id === chargingStationId);
    
    if (station) {
      // Используем цену выбранного коннектора или fallback на цену станции
      const pricePerMin = selectedConnector 
        ? Number(selectedConnector.pricePerMinute || selectedConnector.pricePerKwh || 0)
        : station.pricePerMinute;
      
      const cost = chargingDuration * pricePerMin;
      
      const connectorInfo = selectedConnector 
        ? `\n🔌 Коннектор: ${selectedConnector.type}`
        : '';
      
      const confirmStop = confirm(
        `Завершить зарядку?\n\n` +
        `⏱️ Время зарядки: ${Math.round(chargingDuration)} мин\n` +
        `💰 Стоимость: ${cost.toFixed(2)} сом\n` +
        `🏢 Станция: ${station.name}${connectorInfo}`
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
        // await fetch('/api/charging/stop', { 
        //   method: 'POST', 
        //   body: JSON.stringify({ 
        //     stationId: chargingStationId,
        //     connectorId: selectedConnector?.id 
        //   }) 
        // });
        
        alert(
          `🎉 Зарядка завершена!\n\n` +
          `⏱️ Время: ${Math.round(chargingDuration)} мин\n` +
          `💰 Списано: ${cost.toFixed(2)} сом\n` +
          `💳 Остаток на балансе: ${(userBalance - cost).toFixed(2)} сом\n` +
          `🏢 Станция: ${station.name}${connectorInfo}`
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
    setShowDateSelector(false);
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
    if (!selectedDate || bookedSlots.length === 0) {
      return true; // Если нет данных о занятых слотах, считаем доступным
    }

    // Формируем дату и время начала выбранного слота
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    
    // Формируем дату и время окончания выбранного слота
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

    // Проверяем пересечение с каждым забронированным слотом
    for (const booked of bookedSlots) {
      const bookedStart = new Date(booked.start);
      const bookedEnd = new Date(booked.end);

      // Проверяем пересечение временных интервалов
      // Слот занят если:
      // 1. Начало нашего слота попадает в забронированный интервал
      // 2. Конец нашего слота попадает в забронированный интервал
      // 3. Наш слот полностью покрывает забронированный интервал
      const hasOverlap = (
        (slotStart >= bookedStart && slotStart < bookedEnd) || // Начало попадает
        (slotEnd > bookedStart && slotEnd <= bookedEnd) ||     // Конец попадает
        (slotStart <= bookedStart && slotEnd >= bookedEnd)     // Полное покрытие
      );

      if (hasOverlap) {
        return false; // Слот занят
      }
    }

    return true; // Слот свободен
  };

  // Загрузить занятые слоты для выбранной даты и коннектора
  const loadBookedSlots = async (stationId: string, connectorId: string) => {
    if (!selectedDate || !connectorId) return;

    setIsLoadingSlots(true);
    
    try {
      const response = await fetch(
        `/api/stations/${stationId}/available-slots?date=${selectedDate}&connectorId=${connectorId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setBookedSlots(data.bookedSlots || []);
      } else {
        setBookedSlots([]);
      }
    } catch (error) {
      setBookedSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Загружаем занятые слоты при изменении даты или коннектора
  useEffect(() => {
    if (bookingStation && selectedDate && selectedConnector) {
      loadBookedSlots(bookingStation.id, selectedConnector.id);
    }
  }, [bookingStation, selectedDate, selectedConnector]);

  // Проверяем доступность выбранного времени при изменении длительности
  useEffect(() => {
    if (selectedTime && selectedDate && !isTimeSlotAvailable(selectedTime, selectedDuration)) {
      // Если выбранное время стало недоступным, сбрасываем выбор
      setSelectedTime('');
    }
  }, [selectedDuration, bookedSlots]);

  // Подтвердить бронирование
  const confirmBooking = async () => {
    if (!bookingStation || !selectedDate || !selectedTime) {
      alert('Пожалуйста, выберите дату и время');
      return;
    }

    if (!selectedConnector) {
      alert('Пожалуйста, выберите коннектор');
      return;
    }

    if (userBalance < 100) {
      alert('Недостаточно средств для депозита (100 сом)');
      return;
    }

    setIsProcessingBooking(true);

    try {
      // Формируем дату и время начала
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Отправляем запрос на создание бронирования с выбранным коннектором
      const response = await fetch('/api/user/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectorId: selectedConnector.id,
          startTime: startDateTime.toISOString(),
          duration: selectedDuration
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании бронирования');
      }

      // Обновляем баланс пользователя
      setUserBalance(prev => prev - 100);

      // Создаем объект бронирования для отображения
      const booking = {
        id: data.booking.id,
        station: bookingStation,
        connector: selectedConnector,
        date: selectedDate,
        time: selectedTime,
        duration: selectedDuration,
        deposit: 100,
        createdAt: new Date().toISOString()
      };

      setCurrentBooking(booking);
      setBookingSuccess(true);

    } catch (error: any) {
      alert(`❌ ${error.message || 'Ошибка при создании бронирования. Попробуйте еще раз.'}`);
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
              <div className="bg-emerald-500 text-white rounded-xl p-3 shadow-2xl max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">⚡ Зарядка</div>
                    <div className="text-emerald-100 text-xs">
                      {(() => {
                        if (!isClient || !chargingStartTime) return '0 мин • 0 сом';
                        const station = stations.find(s => s.id === chargingStationId);
                        const duration = Math.floor((Date.now() - chargingStartTime) / 1000 / 60);
                        const cost = station ? duration * station.pricePerMinute : 0;
                        return `${duration} мин • ${cost.toFixed(0)} сом`;
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={stopCharging}
                    className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-lg transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Stations Indicator */}
          {isLoadingStations && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-[#0f2d26] border border-emerald-500/30 rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
                <span className="text-white text-sm">Загрузка...</span>
              </div>
            </div>
          )}

          {/* No Stations Message */}
          {!isLoadingStations && filteredStations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-[#0f2d26] border-2 border-emerald-500/30 rounded-xl p-6 shadow-2xl max-w-sm mx-4 pointer-events-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="text-emerald-400" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {stations.length === 0 ? 'Станций нет' : 'Не найдено'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {stations.length === 0 
                      ? 'Станции еще не добавлены' 
                      : 'Измените фильтры'}
                  </p>
                  {stations.length > 0 && (
                    <button
                      onClick={() => setShowFilter(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 mx-auto"
                    >
                      <SlidersHorizontal size={18} />
                      Фильтры
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

          {/* Navigation Mode - Simulation or Real */}
          {isNavigating && routeInfo && (
            <>
              {/* Simulation Controls */}
              {isSimulating && (
                <>
                  <SimulationControls
                    isPlaying={!isSimulationPaused}
                    speed={simulationSpeed}
                    onPlayPause={() => {
                      if (isSimulationPaused) {
                        resumeSimulation();
                      } else {
                        pauseSimulation();
                      }
                    }}
                    onReset={resetSimulation}
                    onSpeedChange={setSimulationSpeed}
                    onExit={() => {
                      stopSimulation();
                      setIsNavigating(false);
                    }}
                  />
                  
                  <NavigationSimulator
                    routeCoordinates={routeCoordinates}
                    routeSteps={routeInfo.steps}
                    speed={simulationSpeed}
                    onPositionUpdate={handleSimulationPositionUpdate}
                    onStepChange={handleSimulationStepChange}
                    onArrival={handleSimulationArrival}
                    isActive={!isSimulationPaused}
                    stationName={selectedStation?.name || 'зарядки'}
                  />
                </>
              )}

              {/* Navigation Panel */}
              {/* ВАЖНО: показываем СЛЕДУЮЩИЙ маневр (currentStepIndex + 1), 
                  потому что в OSRM маневр находится в начале каждого шага.
                  Пока едем в шаге N, объявляется маневр шага N+1 */}
              <NavigationPanel
                currentStep={routeInfo.steps[currentStepIndex + 1] || routeInfo.steps[currentStepIndex]}
                nextStep={currentStepIndex + 2 < routeInfo.steps.length ? routeInfo.steps[currentStepIndex + 2] : undefined}
                distanceToStep={distanceToCurrentStep || routeInfo.steps[currentStepIndex]?.distance || 0}
                remainingDistance={routeInfo.steps.slice(currentStepIndex).reduce((sum, step) => sum + step.distance, 0) / 1000}
                remainingTime={routeInfo.steps.slice(currentStepIndex).reduce((sum, step) => sum + step.duration, 0)}
                allSteps={routeInfo.steps}
                currentStepIndex={currentStepIndex + 1}
                onShowAllSteps={() => setShowNavigationDetails(!showNavigationDetails)}
                onFinish={() => {
                  if (isSimulating) {
                    stopSimulation();
                  } else {
                    finishTrip();
                  }
                }}
                showAllSteps={showNavigationDetails}
                onStepClick={setCurrentStepIndex}
              />
            </>
          )}

          {/* Station Bottom Sheet */}
          <Sheet 
            isOpen={showStationSheet && selectedStation !== null && !isNavigating} 
            onClose={closeStationSheet}
            snapPoints={[0, 1]}
            initialSnap={1}
            disableDrag={false}
          >
            <Sheet.Container>
              <Sheet.Header />
              <Sheet.Content>
                {selectedStation && (
                  <div className="px-4 pb-6 bg-[#0f2d26]">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-white mb-1">{selectedStation.name}</h3>
                      <p className="text-gray-400 text-xs">{selectedStation.address}</p>
                    </div>

                    {/* Route Info */}
                    {routeInfo && (
                      <div className="mb-3 bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Route className="text-emerald-400" size={18} />
                          <span className="text-white font-medium text-sm">Маршрут</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5">
                            <MapPinned className="text-emerald-400" size={14} />
                            <div>
                              <div className="text-gray-400 text-xs">Расстояние</div>
                              <div className="text-white font-medium text-sm">{routeInfo.distance.toFixed(1)} км</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="text-emerald-400" size={14} />
                            <div>
                              <div className="text-gray-400 text-xs">Время</div>
                              <div className="text-white font-medium text-sm">
                                {Math.round(routeInfo.durationInTraffic || routeInfo.duration)} мин
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Connectors List */}
                    {selectedStation.connectors && selectedStation.connectors.length > 0 ? (
                      <div className="mb-4">
                        {/* Compatibility Warning */}
                        {activeVehicle && !selectedStation.connectors.some(c => c.type === activeVehicle.connectorType) && (
                          <div className="mb-3 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                              <div>
                                <h4 className="text-yellow-400 font-semibold text-sm mb-1">
                                  ⚠️ Несовместимо с вашим автомобилем
                                </h4>
                                <p className="text-gray-300 text-xs mb-2">
                                  Ваш {activeVehicle.brand} {activeVehicle.model} использует разъём <span className="font-semibold text-yellow-400">{formatConnectorType(activeVehicle.connectorType)}</span>, 
                                  но эта станция имеет только: <span className="font-semibold text-yellow-400">{selectedStation.connectors.map(c => formatConnectorType(c.type)).join(', ')}</span>
                                </p>
                                <Link
                                  href="/vehicles"
                                  className="text-yellow-400 hover:text-yellow-300 text-xs font-medium underline"
                                >
                                  Сменить активный автомобиль →
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {(() => {
                          // Фильтруем коннекторы: если есть активный автомобиль, показываем только совместимые
                          const displayConnectors = activeVehicle 
                            ? selectedStation.connectors.filter(c => c.type === activeVehicle.connectorType)
                            : selectedStation.connectors;
                          
                          return (
                            <>
                              <h4 className="text-white font-semibold text-sm mb-2">
                                Коннекторы ({displayConnectors.length}{activeVehicle && displayConnectors.length < selectedStation.connectors.length ? ` из ${selectedStation.connectors.length}` : ''})
                                {activeVehicle && displayConnectors.length < selectedStation.connectors.length && (
                                  <span className="text-xs text-gray-400 font-normal ml-2">
                                    (показаны только совместимые)
                                  </span>
                                )}
                              </h4>
                              <div className="space-y-2">
                                {displayConnectors.map((connector) => {
                                  const isSelected = selectedConnector?.id === connector.id;
                                  const isAvailable = connector.status === 'available';
                                  
                                  return (
                                    <button
                                      key={connector.id}
                                      onClick={() => setSelectedConnector(connector)}
                                      disabled={!isAvailable}
                                      className={`w-full text-left p-3 rounded-xl border-2 transition ${
                                        isSelected
                                          ? 'bg-emerald-500/20 border-emerald-500'
                                          : isAvailable
                                          ? 'bg-[#0a1f1a] border-emerald-900/30 hover:border-emerald-500/50'
                                          : 'bg-[#0a1f1a] border-gray-700 opacity-50 cursor-not-allowed'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-white font-semibold text-sm">
                                            {formatConnectorType(connector.type)}
                                          </span>
                                        </div>
                                        {isSelected && (
                                          <CheckCircle className="text-emerald-400" size={18} />
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">
                                          {Number(connector.powerKw)} кВт
                                        </span>
                                        <span className="text-emerald-400 font-semibold">
                                          {Number(connector.pricePerMinute || connector.pricePerKwh || 0)} сом/мин
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {/* Кнопка для показа всех коннекторов */}
                              {activeVehicle && displayConnectors.length < selectedStation.connectors.length && (
                                <button
                                  onClick={() => {
                                    // Временно отключаем фильтр для просмотра всех коннекторов
                                    // Можно добавить состояние showAllConnectors если нужно
                                  }}
                                  className="w-full mt-2 text-center text-xs text-gray-400 hover:text-white transition py-2"
                                >
                                  Показать все коннекторы ({selectedStation.connectors.length})
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Fallback для старых станций без коннекторов */
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#0a1f1a] rounded-xl p-3">
                            <div className="text-gray-400 text-xs mb-1">Статус</div>
                            <div className={`font-semibold text-sm ${
                              selectedStation.status === 'available' ? 'text-emerald-400' :
                              selectedStation.status === 'busy' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {getStatusText(selectedStation.status)}
                            </div>
                          </div>
                          <div className="bg-[#0a1f1a] rounded-xl p-3">
                            <div className="text-gray-400 text-xs mb-1">Мощность</div>
                            <div className="text-white font-semibold text-sm">{selectedStation.maxPowerKw} кВт</div>
                          </div>
                          <div className="bg-[#0a1f1a] rounded-xl p-3">
                            <div className="text-gray-400 text-xs mb-1">Коннектор</div>
                            <div className="text-white font-semibold text-sm">{selectedStation.connectorType}</div>
                          </div>
                          <div className="bg-[#0a1f1a] rounded-xl p-3">
                            <div className="text-gray-400 text-xs mb-1">Цена</div>
                            <div className="text-emerald-400 font-semibold text-sm">{selectedStation.pricePerMinute} сом/мин</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {!routeInfo ? (
                        <>
                          <button
                            onClick={() => buildRoute(selectedStation)}
                            disabled={isLoadingRoute}
                            className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-xs"
                          >
                            {isLoadingRoute ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                <span>Построение...</span>
                              </>
                            ) : (
                              <>
                                <Route size={16} />
                                <span>Маршрут</span>
                              </>
                            )}
                          </button>
                          
                          {!isCharging && (
                            <button
                              onClick={() => startCharging(selectedStation)}
                              disabled={!selectedConnector || selectedConnector.status !== 'available'}
                              className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-xs"
                            >
                              <Zap size={16} />
                              <span>
                                {!selectedConnector ? 'Выберите коннектор' :
                                 selectedConnector.status === 'available' ? 'Зарядка' : 'Недоступно'}
                              </span>
                            </button>
                          )}
                          
                          {isCharging && chargingStationId === selectedStation.id && (
                            <button
                              onClick={stopCharging}
                              className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-xs"
                            >
                              <Plug size={16} />
                              <span>Завершить</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              openBookingModal(selectedStation);
                              // Не закрываем окно станции, чтобы пользователь видел выбранный коннектор
                            }}
                            disabled={!selectedConnector || selectedConnector.status !== 'available' || isCharging}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2.5 rounded-xl font-semibold transition text-xs"
                          >
                            {!selectedConnector ? 'Выберите коннектор' :
                             selectedConnector.status === 'available' ? 'Забронировать' : 'Недоступно'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={startSimulation}
                            disabled={isSimulating}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-xs"
                          >
                            <Navigation size={16} />
                            <span>Начать тест-драйв</span>
                          </button>
                          <button
                            onClick={startNavigation}
                            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-xs"
                          >
                            <Navigation size={16} />
                            <span>Реальная навигация</span>
                          </button>
                          <button
                            onClick={clearRoute}
                            className="w-full bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-white py-2 rounded-xl font-medium transition text-xs border border-emerald-900/30"
                          >
                            Очистить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop />
          </Sheet>
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
          
          {/* Search Bar and Filter Button */}
          <div className="max-w-2xl mx-auto mb-6 mt-10">
            <div className="flex gap-3">
              <div className="relative flex-1">
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
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilter(true)}
                className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl transition flex items-center gap-2 relative"
              >
                <SlidersHorizontal size={20} />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Vehicle Compatibility Toggle */}
            {activeVehicle ? (
              <div className="mt-4">
                <button
                  onClick={() => setShowOnlyCompatible(!showOnlyCompatible)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${
                    showOnlyCompatible
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-[#0f2d26] border-emerald-900/30 text-gray-300 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      showOnlyCompatible ? 'bg-emerald-500/30' : 'bg-emerald-500/10'
                    }`}>
                      <Plug className={showOnlyCompatible ? 'text-emerald-400' : 'text-gray-400'} size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        Только совместимые с моим авто
                      </div>
                      <div className="text-xs text-gray-400">
                        {activeVehicle.brand} {activeVehicle.model} • {formatConnectorType(activeVehicle.connectorType)}
                      </div>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition relative ${
                    showOnlyCompatible ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      showOnlyCompatible ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <Link
                  href="/vehicles/add"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-emerald-900/30 text-gray-400 hover:border-emerald-500/50 hover:text-white transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Plug className="text-gray-400" size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        Добавьте автомобиль
                      </div>
                      <div className="text-xs">
                        Для фильтрации по совместимости
                      </div>
                    </div>
                  </div>
                  <Plus size={20} />
                </Link>
              </div>
            )}
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
                  {showOnlyCompatible && activeVehicle
                    ? `Нет станций с разъёмом ${activeVehicle.connectorType}`
                    : searchQuery 
                    ? `Не найдено станций по запросу "${searchQuery}"`
                    : activeFiltersCount > 0
                    ? 'Нет станций, соответствующих выбранным фильтрам'
                    : 'Станций пока нет'}
                </p>
                <p className="text-sm mt-2">
                  {showOnlyCompatible && activeVehicle
                    ? 'Попробуйте отключить фильтр совместимости или добавьте другой автомобиль'
                    : searchQuery
                    ? 'Попробуйте изменить поисковый запрос'
                    : activeFiltersCount > 0
                    ? 'Попробуйте изменить параметры фильтрации'
                    : 'Администратор еще не добавил зарядные станции'}
                </p>
              </div>
              {(searchQuery || activeFiltersCount > 0 || showOnlyCompatible) && (
                <div className="flex gap-3 justify-center flex-wrap">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
                    >
                      Очистить поиск
                    </button>
                  )}
                  {showOnlyCompatible && (
                    <button
                      onClick={() => setShowOnlyCompatible(false)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
                    >
                      Показать все станции
                    </button>
                  )}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => {
                        setFilters({
                          stationType: [],
                          connectorType: [],
                          minPower: 20,
                          maxPower: 250,
                        });
                      }}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition"
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
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
                
                // Подсчитываем доступные коннекторы
                const availableConnectors = station.connectors?.filter(c => c.status === 'available').length || 0;
                const totalConnectors = station.connectors?.length || 0;
                
                return (
                  <div
                    key={station.id}
                    className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6 hover:border-emerald-500/50 transition cursor-pointer"
                    onClick={() => {
                      openStationSheet(station);
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
                        <p className="text-gray-400 text-sm">{station.address}</p>
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

                    {/* Connectors */}
                    {station.connectors && station.connectors.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-400 mb-2">
                          <Zap size={16} />
                          <span>{availableConnectors} из {totalConnectors} доступно</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {station.connectors.slice(0, 4).map((connector, idx) => (
                            <div
                              key={connector.id}
                              className={`text-xs p-2 rounded-lg ${
                                connector.status === 'available'
                                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                                  : 'bg-gray-700/30 border border-gray-600/30 opacity-50'
                              }`}
                            >
                              <div className="text-white font-medium">{connector.type}</div>
                              <div className="text-gray-400">{Number(connector.powerKw)} кВт • {Number(connector.pricePerMinute || connector.pricePerKwh || 0)} сом/мин</div>
                            </div>
                          ))}
                          {station.connectors.length > 4 && (
                            <div className="text-xs p-2 rounded-lg bg-gray-700/30 border border-gray-600/30 flex items-center justify-center">
                              <span className="text-gray-400">+{station.connectors.length - 4} еще</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Fallback для старых станций */
                      <div className="text-gray-400 text-sm">
                        <span>Мощность: {station.maxPowerKw} кВт</span>
                        <span className="ml-4">Коннектор: {station.connectorType}</span>
                      </div>
                    )}
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
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white text-center">Фильтры</h2>
              </div>

              <div className="space-y-4">
                {/* Connector Type */}
                <div>
                  <label className="block text-white font-medium mb-2 text-center text-sm">Тип разъема:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const newTypes = filters.connectorType.includes('CCS2')
                          ? filters.connectorType.filter(t => t !== 'CCS2')
                          : [...filters.connectorType, 'CCS2'];
                        setFilters({ ...filters, connectorType: newTypes });
                      }}
                      className={`py-2.5 px-2 rounded-lg border-2 transition text-xs font-medium ${
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
                      className={`py-2.5 px-2 rounded-lg border-2 transition text-xs font-medium ${
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
                      className={`py-2.5 px-2 rounded-lg border-2 transition text-xs font-medium ${
                        filters.connectorType.includes('Type2')
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#0a1f1a] border-emerald-900/30 text-white hover:border-emerald-500/50'
                      }`}
                    >
                      Type 2
                    </button>
                    <button
                      onClick={() => {
                        const newTypes = filters.connectorType.includes('GB/T')
                          ? filters.connectorType.filter(t => t !== 'GB/T')
                          : [...filters.connectorType, 'GB/T'];
                        setFilters({ ...filters, connectorType: newTypes });
                      }}
                      className={`py-2.5 px-2 rounded-lg border-2 transition text-xs font-medium ${
                        filters.connectorType.includes('GB/T')
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#0a1f1a] border-emerald-900/30 text-white hover:border-emerald-500/50'
                      }`}
                    >
                      GB/T
                    </button>
                  </div>
                </div>

                {/* Power Range */}
                <div>
                  <label className="block text-white font-medium mb-2 text-center text-sm">Мощность</label>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
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
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
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
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setShowFilter(false)}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold transition shadow-lg text-sm"
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
                    className="bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-white py-2.5 rounded-xl font-medium transition border border-emerald-900/30 text-sm"
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

      {/* Booking Bottom Sheet */}
      <Sheet 
        isOpen={showBookingModal && bookingStation !== null}
        onClose={closeBookingModal}
        snapPoints={[0, 1]}
        initialSnap={1}
      >
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>
            {bookingStation && (
              <div className="px-4 pb-6 bg-[#0f2d26]">
                {!bookingSuccess ? (
                  <>
                    {/* Booking Form */}
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-white text-center">Бронирование</h2>
                    </div>

                    {/* Station Info */}
                    <div className="bg-[#0a1f1a] rounded-xl p-3 mb-4">
                      <h3 className="text-white font-bold text-base mb-1">{bookingStation.name}</h3>
                      <p className="text-gray-400 text-xs mb-2">{bookingStation.address}</p>
                    </div>

                    {/* Connector Selection */}
                    {bookingStation.connectors && bookingStation.connectors.length > 0 ? (
                      <div className="mb-4">
                        <label className="block text-white font-medium mb-2 text-sm">
                          Коннектор:
                          {activeVehicle && bookingStation.connectors.filter(c => c.type === activeVehicle.connectorType).length < bookingStation.connectors.length && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">
                              (показаны только совместимые)
                            </span>
                          )}
                        </label>
                        
                        {/* Custom Dropdown */}
                        <div className="relative connector-dropdown-container">
                          <button
                            type="button"
                            onClick={() => setShowConnectorDropdown(!showConnectorDropdown)}
                            className="w-full bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-xl px-4 py-3 text-white hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition text-sm flex items-center justify-between"
                          >
                            <span className={selectedConnector ? 'text-white' : 'text-gray-400'}>
                              {selectedConnector 
                                ? `${formatConnectorType(selectedConnector.type)} • ${Number(selectedConnector.powerKw)} кВт • ${Number(selectedConnector.pricePerMinute || selectedConnector.pricePerKwh || 0)} сом/мин`
                                : 'Выберите коннектор'
                              }
                            </span>
                            <svg 
                              className={`w-5 h-5 text-emerald-400 transition-transform ${showConnectorDropdown ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* Dropdown Menu */}
                          {showConnectorDropdown && (() => {
                            // Фильтруем коннекторы: если есть активный автомобиль, показываем только совместимые
                            const displayConnectors = activeVehicle 
                              ? bookingStation.connectors.filter(c => c.type === activeVehicle.connectorType)
                              : bookingStation.connectors;
                            
                            return (
                              <div className="absolute z-50 w-full mt-2 bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {displayConnectors.map((connector, index) => {
                                  const isAvailable = connector.status === 'available';
                                  const pricePerMin = Number(connector.pricePerMinute || connector.pricePerKwh || 0);
                                  const isSelected = selectedConnector?.id === connector.id;
                                  
                                  return (
                                    <button
                                      key={connector.id}
                                      type="button"
                                      onClick={() => {
                                        if (isAvailable) {
                                          setSelectedConnector(connector);
                                          setShowConnectorDropdown(false);
                                          // Перезагружаем занятые слоты для нового коннектора
                                          loadBookedSlots(bookingStation.id, connector.id);
                                        }
                                      }}
                                      disabled={!isAvailable}
                                      className={`w-full text-left px-4 py-3 transition ${
                                        index !== displayConnectors.length - 1 ? 'border-b border-emerald-900/20' : ''
                                      } ${
                                        isSelected 
                                          ? 'bg-emerald-500/20 text-white' 
                                          : isAvailable 
                                          ? 'hover:bg-emerald-500/10 text-white' 
                                          : 'text-gray-600 cursor-not-allowed'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Plug className={isAvailable ? 'text-emerald-400' : 'text-gray-600'} size={14} />
                                            <span className="font-semibold text-sm">{formatConnectorType(connector.type)}</span>
                                            {!isAvailable && (
                                              <span className="text-xs text-gray-500">(занят)</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 text-xs">
                                            <span className={isAvailable ? 'text-gray-400' : 'text-gray-600'}>
                                              {Number(connector.powerKw)} кВт
                                            </span>
                                            <span className={isAvailable ? 'text-emerald-400 font-semibold' : 'text-gray-600'}>
                                              {pricePerMin} сом/мин
                                            </span>
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <CheckCircle className="text-emerald-400" size={18} />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Selected Connector Info Card */}
                        {selectedConnector && (
                          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Plug className="text-emerald-400" size={16} />
                              <span className="text-white font-semibold text-sm">{formatConnectorType(selectedConnector.type)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">Мощность:</span>
                                <span className="text-white ml-1.5 font-medium">{Number(selectedConnector.powerKw)} кВт</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Цена:</span>
                                <span className="text-emerald-400 ml-1.5 font-semibold">
                                  {Number(selectedConnector.pricePerMinute || selectedConnector.pricePerKwh || 0)} сом/мин
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback для старых станций */
                      <div className="bg-[#0a1f1a] rounded-xl p-3 mb-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Мощность:</span>
                            <span className="text-white ml-1.5">{bookingStation.maxPowerKw} кВт</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Цена:</span>
                            <span className="text-emerald-400 ml-1.5">{bookingStation.pricePerMinute} сом/мин</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Date Selection */}
                    <div className="mb-4">
                      <label className="block text-white font-medium mb-2 text-center text-sm">Дата:</label>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowDateSelector(!showDateSelector)}
                          className="w-full px-4 py-3 bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-xl text-left text-white hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition flex items-center justify-between"
                        >
                          <span className="text-sm">
                            {selectedDate 
                              ? new Date(selectedDate).toLocaleDateString('ru-RU', { 
                                  weekday: 'short', 
                                  day: 'numeric', 
                                  month: 'long',
                                  year: 'numeric'
                                })
                              : 'Выберите дату'
                            }
                          </span>
                          <svg 
                            className={`w-5 h-5 text-emerald-400 transition-transform ${showDateSelector ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        {showDateSelector && (
                          <div className="bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-xl p-3">
                            {/* Calendar Header - Month/Year */}
                            <div className="text-center mb-3">
                              <div className="text-white font-bold text-base">
                                {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                            
                            {/* Days of Week */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                                <div key={day} className="text-center text-gray-400 text-xs font-medium py-1">
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const today = new Date();
                                // Функция для получения локальной даты в формате YYYY-MM-DD
                                const getLocalDateString = (date: Date) => {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                };
                                
                                const todayDateString = getLocalDateString(today);
                                
                                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник = 0
                                const daysInMonth = lastDay.getDate();
                                const days = [];
                                
                                // Empty cells before first day
                                for (let i = 0; i < startDayOfWeek; i++) {
                                  days.push(<div key={`empty-${i}`} className="p-2"></div>);
                                }
                                
                                // Days of month
                                for (let day = 1; day <= daysInMonth; day++) {
                                  // Создаем дату в локальном времени
                                  const dateLocal = new Date(today.getFullYear(), today.getMonth(), day);
                                  const dateValue = getLocalDateString(dateLocal);
                                  const isToday = dateValue === todayDateString;
                                  const isSelected = selectedDate === dateValue;
                                  const isPast = dateValue < todayDateString;
                                  
                                  days.push(
                                    <button
                                      key={day}
                                      onClick={() => {
                                        if (!isPast) {
                                          setSelectedDate(dateValue);
                                          setShowDateSelector(false);
                                        }
                                      }}
                                      disabled={isPast}
                                      className={`p-2 rounded-lg text-center text-sm font-medium transition ${
                                        isPast
                                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-40'
                                          : isSelected
                                          ? 'bg-emerald-600 text-white shadow-lg'
                                          : isToday
                                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500'
                                          : 'bg-[#0f2d26] text-gray-300 hover:bg-emerald-600/20 border border-emerald-900/30'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                }
                                
                                return days;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div className="mb-4">
                      <label className="block text-white font-medium mb-2 text-center text-sm">Время:</label>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowTimeSelector(!showTimeSelector)}
                          className="w-full px-4 py-3 bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-xl text-left text-white hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition flex items-center justify-between"
                        >
                          <span>{selectedTime ? `${selectedTime} (${selectedDuration} мин)` : 'Выберите время'}</span>
                          <svg 
                            className={`w-5 h-5 text-emerald-400 transition-transform ${showTimeSelector ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {showTimeSelector && (
                          <div className="bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-xl p-4">
                            {/* Duration Selection */}
                            <div className="mb-4">
                              <label className="block text-white text-sm font-medium mb-3 text-center">Продолжительность:</label>
                              <div className="grid grid-cols-3 gap-2">
                                {[15, 30, 60].map((duration) => (
                                  <button
                                    key={duration}
                                    onClick={() => setSelectedDuration(duration as 15 | 30 | 60)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                      selectedDuration === duration
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'bg-[#0f2d26] text-gray-400 hover:text-white hover:bg-emerald-600/20 border border-emerald-900/30'
                                    }`}
                                  >
                                    {duration} мин
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Time Slots */}
                            <div className="mb-2">
                              <div className="text-white text-sm font-medium mb-3 text-center">
                                {isLoadingSlots ? (
                                  <span className="text-gray-400">Загрузка доступных слотов...</span>
                                ) : (
                                  <>Доступные слоты: {getAvailableTimeSlots().filter(time => isTimeSlotAvailable(time, selectedDuration)).length}</>
                                )}
                              </div>
                            </div>
                            {isLoadingSlots ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                                {getAvailableTimeSlots().map((time) => {
                                const isSelected = selectedTime === time;
                                const isAvailable = isTimeSlotAvailable(time, selectedDuration);
                                
                                // Функция для получения локальной даты в формате YYYY-MM-DD
                                const getLocalDateString = (date: Date) => {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                };
                                
                                // Проверяем, если выбрана сегодняшняя дата
                                const today = new Date();
                                const todayDateString = getLocalDateString(today);
                                const isToday = selectedDate === todayDateString;
                                let isPastTime = false;
                                
                                if (isToday) {
                                  const now = new Date();
                                  const currentHour = now.getHours();
                                  const currentMinute = now.getMinutes();
                                  const [slotHour, slotMinute] = time.split(':').map(Number);
                                  
                                  // Время прошло, если час меньше текущего, или час равен но минуты меньше/равны
                                  isPastTime = slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute);
                                }
                                
                                const isDisabled = !isAvailable || isPastTime;
                                
                                return (
                                  <button
                                    key={time}
                                    onClick={() => {
                                      if (!isDisabled) {
                                        setSelectedTime(time);
                                        setShowTimeSelector(false);
                                      }
                                    }}
                                    disabled={isDisabled}
                                    className={`px-2 py-2 rounded-lg text-sm font-medium transition ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : isDisabled
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-40'
                                        : 'bg-[#0f2d26] text-gray-300 hover:text-white hover:bg-emerald-600/20 border border-emerald-900/30'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                );
                              })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deposit Info */}
                    <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm mb-1">Депозит</h4>
                          <p className="text-gray-400 text-sm">
                            100 сом будет списано при подтверждении
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Balance Info */}
                    <div className="bg-[#0a1f1a] rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Баланс:</span>
                        <span className={`font-bold ${userBalance >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {userBalance.toFixed(0)} сом
                        </span>
                      </div>
                      {userBalance < 100 && (
                        <div className="mt-1.5 text-red-400 text-xs flex items-center gap-1">
                          <AlertTriangle size={12} />
                          <span>Недостаточно средств</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {userBalance < 100 && (
                        <button
                          onClick={() => {
                            closeBookingModal();
                            setShowTopUpModal(true);
                          }}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl font-medium transition text-sm"
                        >
                          Пополнить
                        </button>
                      )}
                      
                      <button
                        onClick={confirmBooking}
                        disabled={!selectedDate || !selectedTime || userBalance < 100 || isProcessingBooking}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm"
                      >
                        {isProcessingBooking ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Создание...</span>
                          </>
                        ) : (
                          'Подтвердить'
                        )}
                      </button>
                      
                      <button
                        onClick={closeBookingModal}
                        className="w-full bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-white py-2.5 rounded-xl font-medium transition border border-emerald-900/30 text-sm"
                      >
                        Назад
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Booking Success */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-emerald-400" size={40} />
                      </div>
                      
                      <h2 className="text-xl font-bold text-white mb-4">Успешно!</h2>
                      
                      <div className="bg-[#0a1f1a] rounded-xl p-4 mb-4 text-left">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Станция:</span>
                            <span className="text-white font-medium">{currentBooking?.station.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Дата:</span>
                            <span className="text-white font-medium">
                              {new Date(currentBooking?.date).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short'
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
                            <span className="text-red-400 font-medium">100 сом</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 mb-4">
                        <p className="text-blue-100 text-xs">
                          Отмена за 30 мин до начала
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            router.push('/bookings');
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition text-sm"
                        >
                          Мои брони
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={closeBookingModal}
                            className="flex-1 bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-white py-2.5 rounded-xl font-medium transition border border-emerald-900/30 text-xs"
                          >
                            Главная
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>

      {/* Bottom Navigation - скрывается когда открыты модальные окна */}
      {!showNavigationDetails && !showStationSheet && !showFilter && !showTopUpModal && !showBookingModal && (
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
      )}
    </div>
  );
}
