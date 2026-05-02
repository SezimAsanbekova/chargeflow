'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, User, Clock } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  depositAmount: number;
  user: {
    email: string;
    phone: string | null;
  };
  connector: {
    type: string;
    station: {
      name: string;
      address: string;
    };
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активно';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      case 'expired':
        return 'Истекло';
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status === 'active').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Бронирования</h1>
          <p className="text-gray-400">Управление бронированиями станций</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-gray-400 text-sm">Всего</div>
          </div>
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
            <div className="text-gray-400 text-sm">Активных</div>
          </div>
          <div className="bg-[#0f2d26] border border-blue-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.completed}</div>
            <div className="text-gray-400 text-sm">Завершено</div>
          </div>
          <div className="bg-[#0f2d26] border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.cancelled}</div>
            <div className="text-gray-400 text-sm">Отменено</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
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

        {/* Bookings List */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Нет бронирований</div>
          ) : (
            <div className="divide-y divide-emerald-900/30">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-6 hover:bg-[#0a1f1a] transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium text-lg">
                          {booking.connector.station.name}
                        </h3>
                        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>{booking.connector.station.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>{booking.user.phone || booking.user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>
                            {formatDate(booking.startTime)} - {formatDate(booking.endTime)}
                          </span>
                        </div>
                        <div>
                          Разъём: {booking.connector.type} | Депозит: {booking.depositAmount} сом
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
