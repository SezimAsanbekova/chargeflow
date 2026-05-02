'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import Link from 'next/link';

interface Connector {
  type: string;
  powerKw: number;
  pricePerKwh: number;
  status: string;
}

export default function NewStationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    CCS2: true,
    CHAdeMO: false,
    Type2: false,
    GB_T: false,
  });

  const [connectorSettings, setConnectorSettings] = useState({
    powerKw: '50',
    pricePerKwh: '15',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

      const response = await fetch('/api/admin/stations', {
        method: 'POST',
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
        throw new Error(data.error || 'Ошибка создания станции');
      }

      router.push('/admin/stations');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleConnector = (type: keyof typeof connectors) => {
    setConnectors({ ...connectors, [type]: !connectors[type] });
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Добавить станцию
          </h1>
          <p className="text-gray-400">Заполните информацию о новой станции</p>
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
                  placeholder="Например: Станция на Чуй"
                  required
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Адрес *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Например: ул. Чуй 123, Бишкек"
                  required
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Широта *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    placeholder="42.8746"
                    required
                    className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Долгота *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    placeholder="74.5698"
                    required
                    className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

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
                  placeholder="24/7 или 08:00-22:00"
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Статус
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="text-emerald-500"
                    />
                    Активна
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="maintenance"
                      checked={formData.status === 'maintenance'}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="text-yellow-500"
                    />
                    Обслуживание
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="text-red-500"
                    />
                    Отключена
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
                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="checkbox"
                      checked={connectors.CCS2}
                      onChange={() => toggleConnector('CCS2')}
                      className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                    <span className="text-white">CCS2</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="checkbox"
                      checked={connectors.CHAdeMO}
                      onChange={() => toggleConnector('CHAdeMO')}
                      className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                    <span className="text-white">CHAdeMO</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="checkbox"
                      checked={connectors.Type2}
                      onChange={() => toggleConnector('Type2')}
                      className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                    <span className="text-white">Type 2</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="checkbox"
                      checked={connectors.GB_T}
                      onChange={() => toggleConnector('GB_T')}
                      className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                    <span className="text-white">GB/T</span>
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
                    Цена (сом/кВт⋅ч) *
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
                Выбранные разъёмы будут созданы с указанными мощностью и ценой
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href="/admin/stations"
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-center"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
