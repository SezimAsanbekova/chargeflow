'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Edit, Trash2, Power, Zap } from 'lucide-react';
import Link from 'next/link';

interface Connector {
  id: string;
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
  connectors: Connector[];
  _count: {
    connectors: number;
  };
}

export default function AdminStationsPage() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/admin/stations');
      if (response.ok) {
        const data = await response.json();
        setStations(data.stations);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту станцию?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/stations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStations(stations.filter((s) => s.id !== id));
      } else {
        alert('Ошибка при удалении станции');
      }
    } catch (error) {
      console.error('Error deleting station:', error);
      alert('Ошибка при удалении станции');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'maintenance':
        return 'Обслуживание';
      case 'inactive':
        return 'Отключена';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Управление станциями
            </h1>
            <p className="text-gray-400">
              Всего станций: {stations.length}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              ← Назад
            </Link>
            <Link
              href="/admin/stations/new"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
            >
              <Plus size={20} />
              Добавить станцию
            </Link>
          </div>
        </div>

        {/* Stations Grid */}
        {stations.length === 0 ? (
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-12 text-center">
            <MapPin className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-white text-xl font-semibold mb-2">
              Нет станций
            </h3>
            <p className="text-gray-400 mb-6">
              Добавьте первую зарядную станцию
            </p>
            <Link
              href="/admin/stations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
            >
              <Plus size={20} />
              Добавить станцию
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <div
                key={station.id}
                className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 hover:border-emerald-500 transition"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      station.status
                    )}`}
                  >
                    {getStatusText(station.status)}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/stations/${station.id}/edit`}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition"
                      title="Редактировать"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(station.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Station Info */}
                <h3 className="text-white text-lg font-semibold mb-2">
                  {station.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4 flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  {station.address}
                </p>

                {/* Connectors */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Zap size={16} />
                    <span>{station._count.connectors} разъёмов</span>
                  </div>
                </div>

                {/* Connector Types */}
                {station.connectors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-900/30">
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(station.connectors.map((c) => c.type))
                      ).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
