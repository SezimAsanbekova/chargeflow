'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, X, AlertCircle } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

interface Booking {
  id: string;
  station: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  connector: {
    id: string;
    type: string;
    powerKw: number;
    pricePerKwh: number;
  };
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  depositAmount: number;
  depositStatus: 'held' | 'returned' | 'lost';
  cancelDeadline: string;
  createdAt: string;
}

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/user/bookings');
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          console.error('Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchBookings();
    }
  }, [session]);

  const calculateEndTime = (startTime: string) => {
    const start = new Date(startTime);
    return start.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return diffMinutes;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const canCancelBooking = (booking: Booking) => {
    if (booking.status !== 'active') return false;
    
    const cancelDeadline = new Date(booking.cancelDeadline);
    const now = new Date();
    
    return now < cancelDeadline;
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    setCancelling(true);
    
    try {
      const response = await fetch('/api/user/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingToCancel.id,
          action: 'cancel'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отмене бронирования');
      }
      
      // Обновляем статус бронирования в локальном состоянии
      setBookings(prev => prev.map(booking => 
        booking.id === bookingToCancel.id 
          ? { ...booking, status: 'cancelled' as const, depositStatus: 'returned' as const }
          : booking
      ));
      
      alert('✅ Бронирование отменено. Депозит возвращен на ваш баланс.');
      
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
      setBookingToCancel(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'completed':
        return 'text-blue-400 bg-blue-500/20';
      case 'cancelled':
        return 'text-red-400 bg-red-500/20';
      case 'expired':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const activeBookings = bookings.filter(b => b.status === 'active');
  const pastBookings = bookings.filter(b => b.status !== 'active');

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/profile"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ArrowLeft className="text-emerald-400" size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Мои брони</h1>
        </div>

        {/* Active Bookings */}
        {activeBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">Активные бронирования</h2>
            <div className="space-y-4">
              {activeBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{booking.station.name}</h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <MapPin size={14} />
                        {booking.station.address}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#0a1f1a] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Calendar size={14} />
                        Дата
                      </div>
                      <div className="text-white font-medium">{formatDate(booking.startTime)}</div>
                    </div>
                    <div className="bg-[#0a1f1a] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Clock size={14} />
                        Время
                      </div>
                      <div className="text-white font-medium">
                        {formatTime(booking.startTime)} – {calculateEndTime(booking.endTime)}
                      </div>
                    </div>
                  </div>

                  {/* Connector Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#0a1f1a] rounded-lg p-3">
                      <div className="text-gray-400 text-sm mb-1">Коннектор</div>
                      <div className="text-white font-medium">{booking.connector.type}</div>
                    </div>
                    <div className="bg-[#0a1f1a] rounded-lg p-3">
                      <div className="text-gray-400 text-sm mb-1">Мощность</div>
                      <div className="text-white font-medium">{booking.connector.powerKw} кВт</div>
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
                        <div className="text-white font-medium text-sm">
                          Депозит: {booking.depositAmount} сом
                          {booking.depositStatus === 'returned' && (
                            <span className="text-emerald-400 ml-2">(возвращен)</span>
                          )}
                          {booking.depositStatus === 'held' && (
                            <span className="text-gray-400 ml-2">(заблокирован)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href="/map"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition text-center"
                    >
                      Перейти к станции
                    </Link>
                    {canCancelBooking(booking) && (
                      <button
                        onClick={() => {
                          setBookingToCancel(booking);
                          setShowCancelModal(true);
                        }}
                        className="px-6 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 py-3 rounded-lg font-medium transition"
                      >
                        Отменить
                      </button>
                    )}
                  </div>

                  {/* Cancel Warning */}
                  {!canCancelBooking(booking) && booking.status === 'active' && (
                    <div className="mt-3 text-gray-400 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      Отмена возможна не позднее чем за 30 минут до начала
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-400 mb-4">История бронирований</h2>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6 opacity-75"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{booking.station.name}</h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <MapPin size={14} />
                        {booking.station.address}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1f1a] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Calendar size={14} />
                        Дата
                      </div>
                      <div className="text-white font-medium">{formatDate(booking.startTime)}</div>
                    </div>
                    <div className="bg-[#0a1f1a] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Clock size={14} />
                        Время
                      </div>
                      <div className="text-white font-medium">
                        {formatTime(booking.startTime)} – {calculateEndTime(booking.endTime)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {bookings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-emerald-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Нет бронирований</h3>
            <p className="text-gray-400 mb-6">У вас пока нет активных или завершенных бронирований</p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              <MapPin size={20} />
              Найти станцию
            </Link>
          </div>
        )}

        {/* Back to Profile */}
        <div className="mt-8 text-center">
          <Link href="/profile" className="text-gray-400 hover:text-emerald-400 text-sm transition">
            ← Вернуться в профиль
          </Link>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && bookingToCancel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-400">Отменить бронирование</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Booking Info */}
            <div className="bg-[#0a1f1a] rounded-lg p-4 mb-4">
              <h3 className="text-white font-medium mb-2">{bookingToCancel.station.name}</h3>
              <div className="text-gray-400 text-sm space-y-1">
                <div>📍 {bookingToCancel.station.address}</div>
                <div>📅 {formatDate(bookingToCancel.startTime)}</div>
                <div>⏰ {formatTime(bookingToCancel.startTime)} – {calculateEndTime(bookingToCancel.endTime)}</div>
                <div>🔌 {bookingToCancel.connector.type} ({bookingToCancel.connector.powerKw} кВт)</div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">
                    Депозит {bookingToCancel.depositAmount} сом будет возвращен на ваш баланс
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                }}
                disabled={cancelling}
                className="flex-1 bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-gray-300 py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
              >
                {cancelling ? 'Отмена...' : 'Отменить бронь'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}