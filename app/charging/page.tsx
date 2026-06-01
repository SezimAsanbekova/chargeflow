"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getTranslations,
  getLocaleCookie,
  getIntlLocale,
  defaultLocale,
  type Locale,
} from "@/app/i18n";
import {
  Battery,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  X,
} from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";

interface ActiveSession {
  id: string;
  stationName: string;
  stationAddress: string;
  pricePerKwh: number;
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
  kwhRemaining: number;
  minutesRemaining: number;
  lowBalanceWarning: boolean;
  criticalBalanceWarning: boolean;
}

export default function ChargingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [warningType, setWarningType] = useState<"low" | "critical">("low");
  const [stopping, setStopping] = useState(false);
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "charging").then(setT);
  }, [locale]);

  // Загрузка активной сессии
  const loadActiveSession = async () => {
    try {
      const response = await fetch("/api/charging/active");
      if (response.ok) {
        const data = await response.json();
        if (data.active) {
          setActiveSession(data.session);

          // Показываем предупреждение о балансе
          if (data.session.criticalBalanceWarning && !showBalanceWarning) {
            setWarningType("critical");
            setShowBalanceWarning(true);
          } else if (data.session.lowBalanceWarning && !showBalanceWarning) {
            setWarningType("low");
            setShowBalanceWarning(true);
          }
        } else {
          // Нет активной сессии - перенаправляем на карту
          router.push("/map");
        }
      }
    } catch (error) {
      console.error("Error loading active session:", error);
    } finally {
      setLoading(false);
    }
  };

  // Поминутное списание
  const chargingTick = async () => {
    try {
      const response = await fetch("/api/charging/tick", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();

        if (data.stopped) {
          // Зарядка остановлена автоматически
          clearIntervals();
          router.push(
            `/charging/stopped?reason=${data.reason ?? 'insufficient_funds'}&sessionId=${data.session.id}`,
          );
        } else {
          // Обновляем данные сессии
          loadActiveSession();
        }
      }
    } catch (error) {
      console.error("Error in charging tick:", error);
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
    if (status === "authenticated") {
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
      const response = await fetch("/api/charging/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });

      if (response.ok) {
        const data = await response.json();
        clearIntervals();
        router.refresh();
        router.push(`/charging/completed?sessionId=${data.session.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при остановке зарядки");
      }
    } catch (error) {
      console.error("Error stopping charging:", error);
      alert("Ошибка при остановке зарядки");
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">{t?.loading ?? "Загрузка..."}</div>
      </div>
    );
  }

  if (!activeSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-20">
      {/* Header */}
      <div className="bg-[#0a1f1a] text-white p-6">
        <h1 className="text-2xl font-bold mb-2">
          {t?.active?.title ?? "Активная зарядка"}
        </h1>
        <p className="text-gray-400 text-sm">{activeSession.stationName}</p>
        <p className="text-gray-400 text-xs mt-1">
          {activeSession.stationAddress}
        </p>
      </div>

      {/* Deposit Info Banner */}
      {activeSession.depositAmount > 0 && (
        <div className="mx-6 mb-2 bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center mt-0.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 font-semibold text-sm">
              {t?.active?.depositTitle ?? "Депозит используется"}
            </p>
            <p className="text-gray-300 text-sm mt-0.5">
              {(t?.active?.depositInfo ?? "Ваш депозит {amount} сом покрывает ~{kwh} кВт·ч зарядки")
                .replace("{amount}", Math.round(activeSession.depositAmount))
                .replace(
                  "{kwh}",
                  activeSession.pricePerKwh > 0
                    ? (activeSession.depositAmount / activeSession.pricePerKwh).toFixed(1)
                    : "0",
                )}
            </p>
          </div>
        </div>
      )}

      {/* Charging Animation */}
      <div className="bg-[#0a1f1a] p-8 flex flex-col items-center">
        {/* Charging Station Icon */}
        <div className="relative w-64 h-48 flex items-center justify-center">
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Charging Station (теперь слева) */}
            <g>
              {/* Station Base */}
              <rect
                x="50"
                y="130"
                width="70"
                height="100"
                rx="8"
                fill="#065f46"
                stroke="#10b981"
                strokeWidth="3"
              />

              {/* Station Screen */}
              <rect
                x="65"
                y="145"
                width="40"
                height="30"
                rx="4"
                fill="#10b981"
                className="animate-pulse"
              />

              {/* Station Display Lines */}
              <line
                x1="70"
                y1="152"
                x2="100"
                y2="152"
                stroke="#064e3b"
                strokeWidth="2"
              />
              <line
                x1="70"
                y1="160"
                x2="95"
                y2="160"
                stroke="#064e3b"
                strokeWidth="2"
              />
              <line
                x1="70"
                y1="168"
                x2="90"
                y2="168"
                stroke="#064e3b"
                strokeWidth="2"
              />

              {/* Lightning Bolt on Station */}
              <path
                d="M 90 195 L 80 210 L 88 210 L 78 225 L 93 207 L 85 207 L 95 195 Z"
                fill="#10b981"
                className="animate-pulse"
              />

              {/* Station Top Circle */}
              <circle
                cx="85"
                cy="90"
                r="25"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />

              {/* Lightning in Circle */}
              <path
                d="M 90 75 L 80 90 L 88 90 L 78 105 L 93 87 L 85 87 L 95 75 Z"
                fill="#10b981"
              />

              {/* Station Pole */}
              <rect x="80" y="115" width="10" height="15" fill="#065f46" />
            </g>

            {/* Charging Cable */}
            <path
              d="M 120 130 Q 140 150 160 160 L 180 160"
              stroke="#10b981"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className="animate-pulse"
            />

            {/* Car (теперь справа) */}
            <g className="animate-pulse">
              {/* Car Body */}
              <path
                d="M 180 180 L 180 150 Q 180 140 190 140 L 220 140 L 230 120 Q 235 110 245 110 L 290 110 Q 300 110 305 120 L 315 140 L 350 140 Q 360 140 360 150 L 360 180 Q 360 190 350 190 L 190 190 Q 180 190 180 180 Z"
                fill="#10b981"
                stroke="#059669"
                strokeWidth="2"
              />
              {/* Car Windows */}
              <path
                d="M 235 120 L 245 115 L 285 115 L 295 120 L 290 135 L 240 135 Z"
                fill="#064e3b"
                opacity="0.6"
              />
              {/* Car Wheels */}
              <circle
                cx="210"
                cy="190"
                r="12"
                fill="#1f2937"
                stroke="#059669"
                strokeWidth="2"
              />
              <circle cx="210" cy="190" r="6" fill="#374151" />
              <circle
                cx="330"
                cy="190"
                r="12"
                fill="#1f2937"
                stroke="#059669"
                strokeWidth="2"
              />
              <circle cx="330" cy="190" r="6" fill="#374151" />
              {/* Car Details */}
              <line
                x1="200"
                y1="165"
                x2="220"
                y2="165"
                stroke="#059669"
                strokeWidth="1.5"
              />
              <line
                x1="320"
                y1="165"
                x2="340"
                y2="165"
                stroke="#059669"
                strokeWidth="1.5"
              />
            </g>

            {/* Energy Flow Particles */}
            <g className="animate-pulse">
              <circle cx="130" cy="140" r="3" fill="#10b981" opacity="0.8">
                <animate
                  attributeName="cx"
                  from="130"
                  to="180"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.8"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="140" cy="150" r="2" fill="#34d399" opacity="0.6">
                <animate
                  attributeName="cx"
                  from="140"
                  to="180"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="135" cy="145" r="2.5" fill="#6ee7b7" opacity="0.7">
                <animate
                  attributeName="cx"
                  from="135"
                  to="180"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.7"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>

            {/* Ambient Glow Circles */}
            <circle
              cx="85"
              cy="90"
              r="30"
              fill="#10b981"
              opacity="0.1"
              className="animate-ping"
            />
            <circle
              cx="85"
              cy="210"
              r="20"
              fill="#10b981"
              opacity="0.1"
              className="animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
          </svg>
        </div>

        {/* Battery Percentage Display */}
        <div className="mt-6 flex flex-col items-center">
          <div className="text-emerald-400 text-5xl font-bold mb-2">
            {activeSession.batteryPercent}%
          </div>
          <div className="text-gray-400 text-sm mb-3">
            {t?.active?.chargeLevel ?? "Уровень заряда"}
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 rounded-full"
              style={{ width: `${activeSession.batteryPercent}%` }}
            />
          </div>

          <div className="mt-4 text-emerald-400 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>{activeSession.currentPowerKw.toFixed(1)} кВт</span>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="p-6 space-y-4">
        {/* Session Number */}
        <div className="bg-[#0a1f1a] border border-emerald-500/20 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">
            {t?.active?.sessionNumber ?? "Номер сессии"}
          </div>
          <div className="text-white font-mono text-lg">
            {activeSession.id.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div className="bg-[#0a1f1a] border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">
                {t?.active?.stats?.duration ?? "Время зарядки"}
              </span>
            </div>
            <div className="text-white text-2xl font-bold">
              {formatTime(activeSession.durationMinutes)}
            </div>
          </div>

          {/* Energy */}
          <div className="bg-[#0a1f1a] border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Battery className="w-5 h-5" />
              <span className="text-sm">
                {t?.active?.stats?.energy ?? "Энергия"}
              </span>
            </div>
            <div className="text-white text-2xl font-bold">
              {activeSession.energyKwh.toFixed(2)}
              <span className="text-sm ml-1">кВт⋅ч</span>
            </div>
          </div>

          {/* Price per kWh */}
          <div className="bg-[#0a1f1a] border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">
                {t?.active?.stats?.pricePerKwh ?? "Цена/кВт·ч"}
              </span>
            </div>
            <div className="text-white text-2xl font-bold">
              {activeSession.pricePerKwh}
              <span className="text-sm ml-1">сом</span>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-[#0a1f1a] border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">
                {t?.active?.stats?.charged ?? "Списано"}
              </span>
            </div>
            <div className="text-white text-2xl font-bold">
              {Math.round(activeSession.totalCost)}
              <span className="text-sm ml-1">сом</span>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-[#0a1f1a] border border-emerald-500/20 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              {t?.active?.balance ?? "Баланс"}
            </span>
            <span className="text-white text-xl font-bold">
              {Math.round(activeSession.balance)} сом
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {(t?.active?.balanceDuration ?? "Хватит на ~{kwh} кВт·ч").replace(
              "{kwh}",
              activeSession.kwhRemaining.toFixed(1),
            )}
          </div>
        </div>

        {/* Start Time */}
        <div className="bg-[#0a1f1a] border border-emerald-500/20 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">
            {t?.active?.startTime ?? "Время начала"}
          </div>
          <div className="text-white">
            {new Date(activeSession.startTime).toLocaleString(
              getIntlLocale(locale),
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            )}
          </div>
        </div>

        {/* Stop Button */}
        <button
          onClick={() => setShowStopConfirm(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-semibold transition-colors"
        >
          {t?.active?.stopButton ?? "Остановить зарядку"}
        </button>
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1f1a] border border-emerald-500/30 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-white text-xl font-bold mb-4">
              {t?.active?.stopModal?.title ?? "Остановить зарядку?"}
            </h3>
            <div className="text-gray-300 mb-6 space-y-2">
              <p>
                {t?.active?.stopModal?.durationLabel ?? "Время зарядки:"}{" "}
                {formatTime(activeSession.durationMinutes)}
              </p>
              <p>
                {t?.active?.stopModal?.chargedLabel ?? "Списано:"}{" "}
                {Math.round(activeSession.totalCost)} сом
              </p>
              <p>
                {t?.active?.stopModal?.energyLabel ?? "Энергия:"}{" "}
                {activeSession.energyKwh.toFixed(2)} кВт⋅ч
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                disabled={stopping}
              >
                {t?.active?.stopModal?.cancelButton ?? "Отмена"}
              </button>
              <button
                onClick={handleStopCharging}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                disabled={stopping}
              >
                {stopping
                  ? (t?.active?.stopModal?.stopping ?? "Остановка...")
                  : (t?.active?.stopModal?.stopButton ?? "Остановить")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Warning Modal */}
      {showBalanceWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1f1a] border border-emerald-500/30 rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <h3 className="text-white text-xl font-bold">
                {warningType === "critical"
                  ? (t?.active?.balanceWarning?.criticalTitle ??
                    "Критически мало средств!")
                  : (t?.active?.balanceWarning?.lowTitle ?? "Мало средств!")}
              </h3>
            </div>
            <div className="text-gray-300 mb-6">
              <p className="mb-2">
                {(
                  t?.active?.balanceWarning?.balanceLeft ??
                  "На вашем балансе осталось {balance} сом."
                ).replace("{balance}", Math.round(activeSession.balance))}
              </p>
              <p className="text-yellow-400 font-semibold">
                Хватит ещё на {activeSession.kwhRemaining.toFixed(1)} кВт·ч
                (~{activeSession.minutesRemaining} мин).
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBalanceWarning(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {t?.active?.balanceWarning?.continueButton ?? "Продолжить"}
              </button>
              <button
                onClick={() => router.push("/balance")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {t?.active?.balanceWarning?.topUpButton ?? "Пополнить баланс"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
