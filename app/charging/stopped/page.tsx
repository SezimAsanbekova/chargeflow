"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Clock,
  Battery,
  DollarSign,
  CreditCard,
  Home,
} from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

interface StoppedSession {
  id: string;
  stationName: string;
  durationMinutes: number;
  energyKwh: number;
  depositAmount: number;
  totalCost: number;
  balance: number;
}

function StoppedContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const reason = searchParams.get("reason");
  const [sessionData, setSessionData] = useState<StoppedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "charging").then(setT);
  }, [locale]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        router.push("/map");
        return;
      }

      try {
        const response = await fetch(`/api/charging/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSessionData({
            id: data.session.id,
            stationName: data.session.stationName,
            durationMinutes: data.session.durationMinutes,
            energyKwh: data.session.energyKwh,
            depositAmount: data.session.depositAmount || 0,
            totalCost: data.session.totalCost,
            balance: 0, // Баланс 0 при остановке из-за недостатка средств
          });
        } else {
          router.push("/map");
        }
      } catch (error) {
        console.error("Error loading session:", error);
        router.push("/map");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && sessionId) {
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">{t?.loading ?? "Загрузка..."}</div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-20">
      {/* Warning Header */}
      <div className="bg-gradient-to-b from-red-600 to-red-500 text-white p-8 text-center">
        <AlertCircle className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {t?.stopped?.title ?? "Зарядка остановлена"}
        </h1>
        <p className="text-red-100 text-sm">
          {t?.stopped?.reason ?? "Недостаточно средств на балансе"}
        </p>
      </div>

      {/* Session Summary */}
      <div className="p-6 space-y-4">
        {/* Station */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">
            {t?.stopped?.stationLabel ?? "Станция"}
          </div>
          <div className="text-white text-lg font-semibold">
            {sessionData.stationName}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">
              {t?.stopped?.duration ?? "Время зарядки"}
            </span>
          </div>
          <div className="text-white text-2xl font-bold">
            {formatTime(sessionData.durationMinutes)}
          </div>
        </div>

        {/* Energy */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <Battery className="w-5 h-5" />
            <span className="text-sm">
              {t?.stopped?.energy ?? "Переданная энергия"}
            </span>
          </div>
          <div className="text-white text-2xl font-bold">
            {sessionData.energyKwh.toFixed(2)} кВт⋅ч
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-[#0f2820] rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">
              {t?.stopped?.charged ?? "Списанная сумма"}
            </span>
          </div>
          <div className="text-white text-2xl font-bold">
            {Math.round(sessionData.totalCost)} сом
          </div>
          {sessionData.depositAmount > 0 && (
            <div className="text-gray-400 text-sm mt-1">
              {(
                t?.stopped?.depositIncluded ?? "(включая депозит {amount} сом)"
              ).replace(
                "{amount}",
                Math.round(sessionData.depositAmount).toString(),
              )}
            </div>
          )}
        </div>

        {/* Balance */}
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-red-300">
              {t?.stopped?.balanceLabel ?? "Баланс"}
            </span>
            <span className="text-white text-xl font-bold">
              {sessionData.balance} сом
            </span>
          </div>
          <div className="mt-2 text-sm text-red-300">
            {t?.stopped?.balanceHint ??
              "Пополните баланс для продолжения использования сервиса"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => router.push("/balance")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {t?.stopped?.topUpButton ?? "Пополнить баланс"}
          </button>

          <button
            onClick={() => router.push("/map")}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t?.stopped?.homeButton ?? "На главную"}
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function StoppedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
          <div className="text-white text-xl">Загрузка...</div>
        </div>
      }
    >
      <StoppedContent />
    </Suspense>
  );
}
