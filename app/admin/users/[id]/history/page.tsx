'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Clock, DollarSign, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ChargingSession {
  id: string;
  startTime: string;
  endTime: string | null;
  energyConsumed: number;
  cost: number;
  status: string;
  station: {
    name: string;
    address: string;
  };
  connector: {
    type: string;
  };
}

interface User {
  id: string;
  phone: string;
  email: string | null;
}

export default function UserHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserHistory();
  }, [userId]);

  const fetchUserHistory = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/history`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSessions(data.sessions);
      } else {
        alert('Ошибка загрузки истории');
      }
    } catch (error) {
      console.error('Error fetching user history:', error);
      alert('Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'В процессе';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'completed':
        return 'text-blue-400 bg-blue-500/20';
      case 'cancelled':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Пользователь не найден</div>
      </div>
    );
  }

  const totalEnergy = sessions.reduce(
    (sum, s) => sum + (s.energyConsumed || 0),
    0
  );
  const totalCost = sessions.reduce((sum, s) => sum + (s.cost || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft size={20} />
            Назад к пользователям
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            История пользователя
          </h1>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="text-lg">{user.phone}</span>
            {user.email && (
              <>
                <span>•</span>
                <span>{user.email}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-emerald-400" size={24} />
              <span className="text-gray-400 text-sm">Всего сессий</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {sessions.length}
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-yellow-400" size={24} />
              <span className="text-gray-400 text-sm">Энергия</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalEnergy.toFixed(2)} кВт⋅ч
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-green-400" size={24} />
              <span className="text-gray-400 text-sm">Потрачено</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalCost.toFixed(2)} сом
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-emerald-900/30">
            <h2 className="text-xl font-semibold text-white">
              История зарядок
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Нет истории зарядок
            </div>
          ) : (
            <div className="divide-y divide-emerald-900/30">
              {sessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-[#0a1f1a] transition">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium text-lg">
                          {session.station.name}
                        </h3>
                        <span
                          className={`px-3 py-1 text-sm rounded-full ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {getStatusText(session.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <MapPin size={14} />
                        <span>{session.station.address}</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Разъём: {session.connector.type}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400 mb-1">
                        {session.cost.toFixed(2)} сом
                      </div>
                      <div className="text-gray-400 text-sm">
                        {session.energyConsumed.toFixed(2)} кВт⋅ч
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Начало: {formatDate(session.startTime)}</span>
                    </div>
                    {session.endTime && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>Конец: {formatDate(session.endTime)}</span>
                        </div>
                        <span>•</span>
                        <span>
                          Длительность:{' '}
                          {formatDuration(session.startTime, session.endTime)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
