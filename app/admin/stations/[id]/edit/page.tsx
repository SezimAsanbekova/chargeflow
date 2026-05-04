'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Trash2, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Connector {
  id?: string;
  type: string;
  powerKw: number;
  pricePerKwh: number;
  status: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  workingHours: any;
  connectors: Connector[];
}

export default function EditStationPage() {
  const router = useRouter();
  const params = useParams();
  const stationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [station, setStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    status: 'active',
    workingHours: '24/7',
  });

  const [connectors, setConnectors] = useState<{
    CCS2: boolean;
    CHAdeMO: boolean;
    Type2: boolean;
    GB_T: boolean;
  }>({
    CCS2: false,
    CHAdeMO: false,
    Type2: false,
    GB_T: false,
  });

  const [connectorSettings, setConnectorSettings] = useState({
    powerKw: '50',
    pricePerKwh: '15',
  });

  useEffect(() => {
    fetchStation();
  }, [stationId]);

  // Cleanup для таймера поиска
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchStation = async () => {
    try {
      const response = await fetch(`/api/admin/stations/${stationId}`);
      if (response.ok) {
        const data = await response.json();
        const st = data.station;
        setStation(st);
        setFormData({
          name: st.name,
          address: st.address,
          latitude: st.latitude.toString(),
          longitude: st.longitude.toString(),
          status: st.status,
          workingHours: st.workingHours?.schedule || '24/7',
        });

        // Устанавливаем выбранные разъёмы
        const selectedTypes = st.connectors.map((c: Connector) => c.type);
        setConnectors({
          CCS2: selectedTypes.includes('CCS2'),
          CHAdeMO: selectedTypes.includes('CHAdeMO'),
          Type2: selectedTypes.includes('Type2'),
          GB_T: selectedTypes.includes('GB_T'),
        });

        // Берем настройки из первого разъёма
        if (st.connectors.length > 0) {
          setConnectorSettings({
            powerKw: st.connectors[0].powerKw.toString(),
            pricePerKwh: st.connectors[0].pricePerKwh.toString(),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching station:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Формируем массив выбранных разъёмов
      const selectedConnectors = Object.entries(connectors)
        .filter(([_, selected]) => selected)
        .map(([type]) => ({
          type,
          powerKw: parseFloat(connectorSettings.powerKw) || 0,
          pricePerKwh: parseFloat(connectorSettings.pricePerKwh) || 0,
          status: 'available',
        }));

      if (selectedConnectors.length === 0) {
        throw new Error('Выберите хотя бы один тип разъёма');
      }

      const response = await fetch(`/api/admin/stations/${stationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          workingHours: { schedule: formData.workingHours },
          connectors: selectedConnectors,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления станции');
      }

      router.push('/admin/stations');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту станцию?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/stations/${stationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/stations');
      } else {
        alert('Ошибка при удалении станции');
      }
    } catch (error) {
      console.error('Error deleting station:', error);
      alert('Ошибка при удалении станции');
    }
  };

  const toggleConnector = (type: keyof typeof connectors) => {
    setConnectors({ ...connectors, [type]: !connectors[type] });
  };

  // Инициализация карты
  useEffect(() => {
    if (!showMap || !mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [74.7661, 41.2044], // Центр Кыргызстана
      zoom: 7, // Показываем всю страну
    });

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
      
      // Обновляем маркер
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new maplibregl.Marker({ color: '#10b981' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }

      // Получаем адрес по координатам (reverse geocoding)
      fetchAddressFromCoordinates(lat, lng);
    });

    // Меняем курсор на pointer
    map.current.getCanvas().style.cursor = 'pointer';

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [showMap]);

  // Reverse geocoding - получение адреса по координатам
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setFormData((prev) => ({
          ...prev,
          address: data.display_name,
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Обновление маркера при изменении координат
  useEffect(() => {
    if (!map.current || !formData.latitude || !formData.longitude) return;

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new maplibregl.Marker({ color: '#10b981' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    map.current.flyTo({ center: [lng, lat], zoom: 15 });
  }, [formData.latitude, formData.longitude]);

  // Поиск адреса через Nominatim с автодополнением и debounce
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length < 3) {
      setSearchResults([]);
      setShowSuggestions(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setShowMap(true);
    
    // Устанавливаем задержку 1000ms перед запросом
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(value + ', Кыргызстан')}`
        );
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setSearchResults(data);
          setShowSuggestions(data.length > 0);
        } else {
          setSearchResults([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowSuggestions(false);
      } finally {
        setSearching(false);
      }
    }, 1000);
  };

  const selectSearchResult = (result: any) => {
    setFormData((prev) => ({
      ...prev,
      address: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
    }));
    setSearchResults([]);
    setSearchQuery('');
    setShowSuggestions(false);
    setShowMap(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Станция не найдена</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Редактировать станцию
          </h1>
          <p className="text-gray-400">Обновите информацию о станции</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Основная информация
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Название станции *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Адрес *
                </label>
                
                {/* Поиск адреса с автодополнением */}
                <div className="mb-2">
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        placeholder="Поиск: Бишкек, Ош, Нарын, Каракол..."
                        className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition flex items-center gap-1"
                    >
                      <MapPin size={16} />
                      {showMap ? 'Скрыть' : 'Карта'}
                    </button>
                  </div>
                  
                  {/* Подсказки при вводе */}
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="mb-2 bg-[#0a1f1a] border border-emerald-500/30 rounded-lg overflow-hidden max-h-60 overflow-y-auto shadow-lg">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSearchResult(result)}
                          className="w-full text-left px-3 py-2.5 hover:bg-emerald-500/10 text-white text-sm border-b border-emerald-900/30 last:border-b-0 transition"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                            <span className="line-clamp-2">{result.display_name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  readOnly
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none cursor-not-allowed opacity-75"
                />
              </div>

              {/* Карта */}
              {showMap && (
                <div className="space-y-2">
                  <div 
                    ref={mapContainer} 
                    className="w-full h-[350px] rounded-lg overflow-hidden border border-emerald-500/30"
                  />
                  <p className="text-gray-400 text-xs flex items-center gap-1">
                    <MapPin size={14} className="text-emerald-400" />
                    Кликните на карте для выбора точного местоположения (адрес обновится автоматически)
                    {formData.latitude && formData.longitude && (
                      <span className="ml-2 text-emerald-400">
                        ({parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)})
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  График работы
                </label>
                <input
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) =>
                    setFormData({ ...formData, workingHours: e.target.value })
                  }
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Статус
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/20 transition flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                    </div>
                    <span className="group-hover:text-white transition">Активна</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        name="status"
                        value="maintenance"
                        checked={formData.status === 'maintenance'}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600 peer-checked:border-yellow-500 peer-checked:bg-yellow-500/20 transition flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                    </div>
                    <span className="group-hover:text-white transition">Обслуживание</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600 peer-checked:border-red-500 peer-checked:bg-red-500/20 transition flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                    </div>
                    <span className="group-hover:text-white transition">Отключена</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Connectors */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Разъёмы</h2>

            <div className="space-y-4">
              {/* Connector Types */}
              <div>
                <label className="block text-gray-300 mb-3 text-sm">
                  Типы разъёмов *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition group">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={connectors.CCS2}
                        onChange={() => toggleConnector('CCS2')}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-gray-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition flex items-center justify-center">
                        {connectors.CCS2 && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-white group-hover:text-emerald-400 transition">CCS2</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition group">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={connectors.CHAdeMO}
                        onChange={() => toggleConnector('CHAdeMO')}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-gray-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition flex items-center justify-center">
                        {connectors.CHAdeMO && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-white group-hover:text-emerald-400 transition">CHAdeMO</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition group">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={connectors.Type2}
                        onChange={() => toggleConnector('Type2')}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-gray-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition flex items-center justify-center">
                        {connectors.Type2 && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-white group-hover:text-emerald-400 transition">Type 2</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition group">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={connectors.GB_T}
                        onChange={() => toggleConnector('GB_T')}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-gray-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition flex items-center justify-center">
                        {connectors.GB_T && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-white group-hover:text-emerald-400 transition">GB/T</span>
                  </label>
                </div>
              </div>

              {/* Common Settings */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-900/30">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Мощность (кВт) *
                  </label>
                  <input
                    type="number"
                    value={connectorSettings.powerKw}
                    onChange={(e) =>
                      setConnectorSettings({
                        ...connectorSettings,
                        powerKw: e.target.value,
                      })
                    }
                    required
                    className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Цена (сом/мин) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={connectorSettings.pricePerKwh}
                    onChange={(e) =>
                      setConnectorSettings({
                        ...connectorSettings,
                        pricePerKwh: e.target.value,
                      })
                    }
                    required
                    className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-gray-500 text-sm">
                Выбранные разъёмы будут созданы с указанными мощностью и ценой. Цена указывается за минуту зарядки.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
            >
              <Trash2 size={20} />
              Удалить
            </button>
            <Link
              href="/admin/stations"
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-center"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
