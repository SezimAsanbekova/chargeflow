'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Battery, Zap, Clock, DollarSign, AlertTriangle, X } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

interface ActiveSession {
  id: string;
  stationName: string;
  stationAddress: string;
  pricePerMinute: number;
  maxPowerKw: number;
  startTime: string;
  durationMinutes: number;
  energyKwh: number;
  currentPowerKw: number;
  batteryPercent: number;
  depositAmount: number;
  chargeAmount: number;
  totalCost: number;
  balance: number;
  minutesRemaining: number;
  lowBalanceWarning: boolean;
  criticalBalanceWarning: boolean;
}

export default function ChargingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [warningType, setWarningType] = useState<'low' | 'critical'>('low');
  const [stopping, setStopping] = useState(false);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Загрузка активной сессии
  const loadActiveSession = async () => {
    try {
      const response = await fetch('/api/charging/active');
      if (response.ok) {
        const data = await response.json();
        if (data.active) {
          setActiveSession(data.session);
          
          // Показываем предупреждение о балансе
          if (data.session.criticalBalanceWarning && !showBalanceWarning) {
            setWarningType('critical');
            setShowBalanceWarning(true);
          } else if (data.session.lowBalanceWarning && !showBalanceWarning) {
            setWarningType('low');
            setShowBalanceWarning(true);
          }
        } else {
          // Нет активной сессии - перенаправляем на карту
          router.push('/map');
        }
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Поминутное списание
  const chargingTick = async () => {
    try {
      const response = await fetch('/api/charging/tick', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.stopped) {
          // Зарядка остановлена из-за недостатка средств
          clearIntervals();
          router.push(`/charging/stopped?reason=insufficient_funds&sessionId=${data.session.id}`);
        } else {
          // Обновляем данные сессии
          loadActiveSession();
        }
      }
    } catch (error) {
      console.error('Error in charging tick:', error);
    }
  };

  const clearIntervals = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadActiveSession();

      // Обновляем данные каждые 5 секунд
      updateIntervalRef.current = setInterval(loadActiveSession, 5000);

      // Списываем средства каждую минуту
      tickIntervalRef.current = setInterval(chargingTick, 60000);

      return () => {
        clearIntervals();
      };
    }
  }, [status]);

  const handleStopCharging = async () => {
    if (!activeSession) return;

    setStopping(true);
    try {
      const response = await fetch('/api/charging/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id })
      });

      if (response.ok) {
        const data = await response.json();
        clearIntervals();
        router.push(`/charging/completed?sessionId=${data.session.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при остановке зарядки');
      }
    } catch (error) {
      console.error('Error stopping charging:', error);
      alert('Ошибка при остановке зарядки');
    } finally {
      setStopping(false);
      setShowStopConfirm(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}мин`;
    }
    return `${mins}мин`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!activeSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Активная зарядка</h1>
        <p className="text-emerald-100 text-sm">{activeSession.stationName}</p>
        <p className="text-emerald-100 text-xs mt-1">{activeSession.stationAddress}</p>
      </div>

      {/* Battery Animation */}
      <div className="bg-[#0f2820] p-8 flex flex-col items-center">
        <div className="relative w-32 h-48 border-4 border-emerald-500 rounded-lg flex items-end justify-center overflow-hidden">
          {/* Battery Fill */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-1000"
            style={{ height: `${activeSession.batteryPercent}%` }}
          />
          {/* Battery Percentage */}
          <div className="relative z-10 text-white text-3xl font-bold mb-4">
            {activeSession.batteryPercent}%
          </div>
          {/* Battery Top */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-emerald-500 rounded-t" />
        </div>
        <div className="mt-4 text-emerald-400 text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>{activeSession.currentPowerKw.toFixed(1)} кВт</span>
        </div>
      </div>

      {/* Session Info */}
      <div className="p-6 space-y-4">
        {/* Session Number */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Номер сессии</div>
          <div className="text-white font-mono text-lg">
            {activeSession.id.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div className="bg-[#0f2820] rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Время зарядки</span>
            </div>
            <div className="text-white text-2xl font-bold">
              {formatTime(activeSession.durationMinutes)}
            </div>
          </div>

          {/* Energy */}
          <div className="bg-[#0f2820] rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Battery className="w-5 h-5" />
              <span className="text-sm">Энергия</span>
            </div>
            <div className="text-white text-2xl font-bold">
              {activeSession.energyKwh.toFixed(2)}
              <span className="text-sm ml-1">кВт⋅ч</span>
            </div>
          </div>

          {/* Price per minute */}
          <div className="bg-[#0f2820] rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Цена/мин</span>
            </div>
            <div className="text-white text-2xl font-bold">
              {activeSession.pricePerMinute}
              <span className="text-sm ml-1">сом</span>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-[#0f2820] rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Списано</span>
            </div>
            <div className="text-white text-2xl font-bold">
              {Math.round(activeSession.totalCost)}
              <span className="text-sm ml-1">сом</span>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Баланс</span>
            <span className="text-white text-xl font-bold">
              {Math.round(activeSession.balance)} сом
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Хватит на ~{activeSession.minutesRemaining} мин
          </div>
        </div>

        {/* Start Time */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Время начала</div>
          <div className="text-white">
            {new Date(activeSession.startTime).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Stop Button */}
        <button
          onClick={() => setShowStopConfirm(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-semibold transition-colors"
        >
          Остановить зарядку
        </button>
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f2820] rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-white text-xl font-bold mb-4">
              Остановить зарядку?
            </h3>
            <div className="text-gray-300 mb-6 space-y-2">
              <p>Время зарядки: {formatTime(activeSession.durationMinutes)}</p>
              <p>Списано: {Math.round(activeSession.totalCost)} сом</p>
              <p>Энергия: {activeSession.energyKwh.toFixed(2)} кВт⋅ч</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
                disabled={stopping}
              >
                Отмена
              </button>
              <button
                onClick={handleStopCharging}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                disabled={stopping}
              >
                {stopping ? 'Остановка...' : 'Остановить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Warning Modal */}
      {showBalanceWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f2820] rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <h3 className="text-white text-xl font-bold">
                {warningType === 'critical' ? 'Критически мало средств!' : 'Мало средств!'}
              </h3>
            </div>
            <div className="text-gray-300 mb-6">
              <p className="mb-2">
                На вашем балансе осталось {Math.round(activeSession.balance)} сом.
              </p>
              <p className="text-yellow-400 font-semibold">
                Хватит еще на {activeSession.minutesRemaining} {activeSession.minutesRemaining === 1 ? 'минуту' : 'минуты'}.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBalanceWarning(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Продолжить
              </button>
              <button
                onClick={() => router.push('/balance')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Пополнить баланс
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
