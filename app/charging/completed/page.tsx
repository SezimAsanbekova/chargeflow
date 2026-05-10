'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, Battery, DollarSign, FileText, Home } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

interface CompletedSession {
  id: string;
  stationName: string;
  stationAddress: string;
  pricePerMinute: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  energyKwh: number;
  depositAmount: number;
  chargeAmount: number;
  totalCost: number;
  balance: number;
  invoiceId: string;
}

function CompletedContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [sessionData, setSessionData] = useState<CompletedSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        router.push('/map');
        return;
      }

      try {
        const response = await fetch(`/api/charging/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSessionData(data.session);
        } else {
          router.push('/map');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        router.push('/map');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && sessionId) {
      loadSessionData();
    }
  }, [status, sessionId, router]);

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

  if (!sessionData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-20">
      {/* Success Header */}
      <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 text-white p-8 text-center">
        <CheckCircle className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Зарядка завершена!</h1>
        <p className="text-emerald-100 text-sm">{sessionData.stationName}</p>
      </div>

      {/* Session Summary */}
      <div className="p-6 space-y-4">
        {/* Duration */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Время зарядки</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {formatTime(sessionData.durationMinutes)}
          </div>
          <div className="text-gray-400 text-sm mt-1">
            {new Date(sessionData.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(sessionData.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Energy */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Battery className="w-5 h-5" />
            <span className="text-sm">Переданная энергия</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {sessionData.energyKwh.toFixed(2)} кВт⋅ч
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Списанная сумма</span>
          </div>
          
          <div className="space-y-2 text-white">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Депозит</span>
              <span>{Math.round(sessionData.depositAmount)} сом</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                Зарядка ({sessionData.durationMinutes} мин × {sessionData.pricePerMinute} сом)
              </span>
              <span>{Math.round(sessionData.chargeAmount)} сом</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Итого</span>
                <span>{Math.round(sessionData.totalCost)} сом</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Баланс после списания</span>
            <span className="text-white text-xl font-bold">
              {Math.round(sessionData.balance)} сом
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => router.push(`/charging/receipt?invoiceId=${sessionData.invoiceId}`)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Чек
          </button>
          
          <button
            onClick={() => router.push('/map')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            На главную
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function CompletedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    }>
      <CompletedContent />
    </Suspense>
  );
}
