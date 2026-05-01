'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Maximize2, Navigation, Plus, Minus, X, MapPin, List, Wallet, User, SlidersHorizontal } from 'lucide-react';

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

// Тестовые данные станций (Бишкек)
const MOCK_STATIONS: Station[] = [
  {
    id: '1',
    name: 'ЦУМ Зарядная станция',
    address: 'пр. Чуй 155, Бишкек',
    latitude: 42.8746,
    longitude: 74.6122,
    status: 'available',
    maxPowerKw: 150,
    pricePerMinute: 14,
    connectorType: 'CCS2',
  },
  {
    id: '2',
    name: 'Ала-Тоо Charging',
    address: 'пл. Ала-Тоо, Бишкек',
    latitude: 42.8765,
    longitude: 74.6057,
    status: 'busy',
    maxPowerKw: 50,
    pricePerMinute: 14,
    connectorType: 'CHAdeMO',
  },
  {
    id: '3',
    name: 'Дордой Плаза',
    address: 'ул. Киевская 114, Бишкек',
    latitude: 42.8823,
    longitude: 74.6275,
    status: 'available',
    maxPowerKw: 250,
    pricePerMinute: 14,
    connectorType: 'CCS2',
  },
  {
    id: '4',
    name: 'Vefa Center',
    address: 'пр. Манаса 1, Бишкек',
    latitude: 42.8708,
    longitude: 74.6063,
    status: 'maintenance',
    maxPowerKw: 100,
    pricePerMinute: 14,
    connectorType: 'Type2',
  },
  {
    id: '5',
    name: 'Asia Mall',
    address: 'ул. Московская 150, Бишкек',
    latitude: 42.8654,
    longitude: 74.5893,
    status: 'busy',
    maxPowerKw: 150,
    pricePerMinute: 14,
    connectorType: 'CCS2',
  },
];

export default function MapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'balance'>('map');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    stationType: [] as string[],
    connectorType: [] as string[],
    minPower: 20,
    maxPower: 250,
  });

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

  // Фильтрация станций
  const filteredStations = MOCK_STATIONS.filter((station) => {
    // Фильтр по типу станции
    if (filters.stationType.length > 0) {
      const stationType = getStationType(station.maxPowerKw);
      if (!filters.stationType.includes(stationType)) {
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Используем центр Бишкека по умолчанию
          setUserLocation([74.6057, 42.8746]);
        }
      );
    } else {
      setUserLocation([74.6057, 42.8746]);
    }
  }, []);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainer.current || map.current || !userLocation) return;

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

    // Добавляем маркер местоположения пользователя
    new maplibregl.Marker({ color: '#3b82f6' })
      .setLngLat(userLocation)
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [userLocation]);

  // Обновление маркеров при изменении фильтров
  useEffect(() => {
    if (!map.current) return;

    // Удаляем все существующие маркеры станций
    const markers = document.querySelectorAll('.station-marker');
    markers.forEach((marker) => {
      const parent = marker.parentElement;
      if (parent) {
        parent.remove();
      }
    });

    // Добавляем маркеры отфильтрованных станций
    filteredStations.forEach((station) => {
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

      new maplibregl.Marker({ element: el })
        .setLngLat([station.longitude, station.latitude])
        .addTo(map.current!);
    });
  }, [filteredStations]);

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
      {/* Map Container */}
      {activeTab === 'map' && (
        <>
          <div ref={mapContainer} className="flex-1 w-full" />

          {/* No Stations Message */}
          {filteredStations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-[#0f2d26] border-2 border-emerald-500/30 rounded-2xl p-8 shadow-2xl max-w-md mx-4 pointer-events-auto">
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="text-emerald-400" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Таких станций еще нет
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Скоро добавим! Попробуйте изменить параметры фильтрации
                  </p>
                  <button
                    onClick={() => setShowFilter(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 mx-auto"
                  >
                    <SlidersHorizontal size={20} />
                    Изменить фильтры
                  </button>
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

          {/* Station Card */}
          {selectedStation && (
            <div className="absolute bottom-24 left-4 right-4 z-10 bg-[#0f2d26] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl max-w-md mx-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{selectedStation.name}</h3>
                  <p className="text-gray-400 text-sm">{selectedStation.address}</p>
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#0a1f1a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Статус</div>
                  <div className={`font-medium ${getStatusColor(selectedStation.status)}`}>
                    {getStatusText(selectedStation.status)}
                  </div>
                </div>
                <div className="bg-[#0a1f1a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Мощность</div>
                  <div className="text-white font-medium">{selectedStation.maxPowerKw} кВт</div>
                </div>
                <div className="bg-[#0a1f1a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Коннектор</div>
                  <div className="text-white font-medium">{selectedStation.connectorType}</div>
                </div>
                <div className="bg-[#0a1f1a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Цена</div>
                  <div className="text-emerald-400 font-medium">{selectedStation.pricePerMinute} сом/мин</div>
                </div>
              </div>

              <button
                disabled={selectedStation.status !== 'available'}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
              >
                {selectedStation.status === 'available' ? 'Забронировать' : 'Недоступно'}
              </button>
            </div>
          )}
        </>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="flex-1 w-full overflow-y-auto p-4 pb-24">
          <h2 className="text-2xl font-bold text-white mb-4">Зарядные станции</h2>
          {filteredStations.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-12 text-center">
              <div className="text-gray-400 mb-4">
                <SlidersHorizontal size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Нет станций, соответствующих фильтрам</p>
                <p className="text-sm mt-2">Попробуйте изменить параметры фильтрации</p>
              </div>
              <button
                onClick={() => setShowFilter(true)}
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Изменить фильтры
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {filteredStations.map((station) => (
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
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{station.name}</h3>
                      <p className="text-gray-400 text-sm">{station.address}</p>
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
              ))}
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
