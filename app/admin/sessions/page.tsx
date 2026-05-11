'use client';

import { useEffect, useState } from 'react';
import { Zap, User, MapPin, Clock, Plug, Car, Calendar, TrendingUp, Battery } from 'lucide-react';
import Link from 'next/link';

interface ChargingSession {
  id: string;
  startTime: string;
  endTime: string | null;
  energyKwh: number;
  costTotal: number;
  status: string;
  startedVia: string;
  user: {
    id: string;
    email: string;
    phone: string | null;
    name: string | null;
  };
  station: {
    id: string;
    name: string;
    address: string;
  };
  connector: {
    id: string;
    type: string;
    powerKw: number;
    pricePerMinute: number;
  };
  vehicle: {
    brand: string;
    model: string;
    connectorType: string;
  } | null;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  totalEnergy: number;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'В процессе';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/20 text-blue-400';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'error':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'completed':
        return 'Завершена';
      case 'cancelled':
        return 'Отменена';
      case 'error':
        return 'Ошибка';
      default:
        return status;
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Зарядные сессии</h1>
          <p className="text-gray-400">Управление и мониторинг всех зарядных сессий</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-gray-400 text-sm">Всего</div>
            </div>
            <div className="bg-[#0f2d26] border border-blue-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.active}</div>
              <div className="text-gray-400 text-sm">Активных</div>
            </div>
            <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
              <div className="text-gray-400 text-sm">Завершено</div>
            </div>
            <div className="bg-[#0f2d26] border border-red-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.cancelled}</div>
              <div className="text-gray-400 text-sm">Отменено</div>
            </div>
            <div className="bg-[#0f2d26] border border-amber-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.totalRevenue.toFixed(0)}</div>
              <div className="text-gray-400 text-sm">Доход (сом)</div>
            </div>
            <div className="bg-[#0f2d26] border border-purple-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.totalEnergy.toFixed(1)}</div>
              <div className="text-gray-400 text-sm">Энергия (кВт⋅ч)</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0f2d26] text-gray-400 hover:text-white'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'active'
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0f2d26] text-gray-400 hover:text-white'
            }`}
          >
            Активные
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'completed'
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0f2d26] text-gray-400 hover:text-white'
            }`}
          >
            Завершенные
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'cancelled'
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0f2d26] text-gray-400 hover:text-white'
            }`}
          >
            Отмененные
          </button>
        </div>

        {/* Sessions List */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl overflow-hidden">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Нет сессий</div>
          ) : (
            <div className="divide-y divide-emerald-900/30">
              {filteredSessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-[#0a1f1a] transition">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">
                          {session.station.name}
                        </h3>
                        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MapPin size={14} />
                        <span>{session.station.address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-xl">
                        {session.costTotal.toFixed(2)} сом
                      </div>
                      {session.energyKwh > 0 && (
                        <div className="text-gray-400 text-sm">
                          {session.energyKwh.toFixed(2)} кВт⋅ч
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connector Info */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Plug className="text-emerald-400" size={16} />
                      <span className="text-white font-semibold text-sm">
                        Коннектор: {session.connector.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Мощность:</span>
                        <span className="text-white ml-1.5">{session.connector.powerKw} кВт</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Цена:</span>
                        <span className="text-emerald-400 ml-1.5">{session.connector.pricePerMinute} сом/мин</span>
                      </div>
                    </div>
                  </div>

                  {/* User & Vehicle Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#0a1f1a] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="text-blue-400" size={16} />
                        <span className="text-white font-medium text-sm">Пользователь</span>
                      </div>
                      <div className="text-gray-400 text-xs space-y-1">
                        <div>{session.user.name || session.user.email}</div>
                        {session.user.phone && <div>{session.user.phone}</div>}
                      </div>
                    </div>
                    {session.vehicle && (
                      <div className="bg-[#0a1f1a] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Car className="text-purple-400" size={16} />
                          <span className="text-white font-medium text-sm">Автомобиль</span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {session.vehicle.brand} {session.vehicle.model}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Info */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} />
                      <div>
                        <div className="text-xs text-gray-500">Дата</div>
                        <div className="text-white">{formatDate(session.startTime)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={14} />
                      <div>
                        <div className="text-xs text-gray-500">Время</div>
                        <div className="text-white">
                          {formatTime(session.startTime)}
                          {session.endTime && ` - ${formatTime(session.endTime)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Zap size={14} />
                      <div>
                        <div className="text-xs text-gray-500">Длительность</div>
                        <div className="text-white">
                          {calculateDuration(session.startTime, session.endTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href="/admin/dashboard"
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Назад к панели
          </Link>
        </div>
      </div>
    </div>
  );
}
