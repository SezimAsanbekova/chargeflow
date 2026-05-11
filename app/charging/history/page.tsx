'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, Zap, MapPin, Clock, Plug, Car, Calendar } from 'lucide-react';

interface ChargingSession {
  id: string;
  startTime: string;
  endTime: string | null;
  energyKwh: number;
  costTotal: number;
  status: string;
  startedVia: string;
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
  } | null;
}

export default function ChargingHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/user/charging-history');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
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
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/profile"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">История зарядок</h1>
            <p className="text-gray-400 text-sm">{sessions.length} сессий</p>
          </div>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <History className="text-emerald-400" size={48} />
            </div>
            <h2 className="text-xl font-bold mb-2">Нет зарядок</h2>
            <p className="text-gray-400 text-center mb-8">
              История ваших зарядных сессий появится здесь
            </p>
            <Link
              href="/map"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition"
            >
              Найти станцию
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-base mb-1">
                      {session.station.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <MapPin size={12} />
                      <span>{session.station.address}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
                    {getStatusText(session.status)}
                  </span>
                </div>

                {/* Connector Info */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Plug className="text-emerald-400" size={16} />
                    <span className="text-white font-semibold text-sm">
                      {session.connector.type}
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

                {/* Session Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
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
                </div>

                {/* Stats */}
                <div className="mt-3 pt-3 border-t border-emerald-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Длительность:</span>
                      <span className="text-white ml-1.5 font-medium">
                        {calculateDuration(session.startTime, session.endTime)}
                      </span>
                    </div>
                    {session.energyKwh > 0 && (
                      <div>
                        <span className="text-gray-400">Энергия:</span>
                        <span className="text-white ml-1.5 font-medium">
                          {session.energyKwh.toFixed(2)} кВт⋅ч
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-lg">
                      {session.costTotal.toFixed(2)} сом
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                {session.vehicle && (
                  <div className="mt-3 pt-3 border-t border-emerald-900/30 flex items-center gap-2 text-sm text-gray-400">
                    <Car size={14} />
                    <span>{session.vehicle.brand} {session.vehicle.model}</span>
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
