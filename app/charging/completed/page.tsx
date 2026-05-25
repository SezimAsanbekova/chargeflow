"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Battery,
  DollarSign,
  FileText,
  Home,
} from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";
import {
  getTranslations,
  getLocaleCookie,
  getIntlLocale,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

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
  const sessionId = searchParams.get("sessionId");
  const [sessionData, setSessionData] = useState<CompletedSession | null>(null);
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
          setSessionData(data.session);
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
      {/* Success Header */}
      <div className="bg-[#0a1f1a] text-white pt-10 pb-6 px-6 text-center border-b border-emerald-900/40">
        <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold mb-1">
          {t?.completed?.title ?? "Зарядка завершена!"}
        </h1>
        <p className="text-gray-400 text-sm">{sessionData.stationName}</p>
      </div>

      {/* Session Summary */}
      <div className="px-6">
        {/* Duration */}
        <div className="py-4 border-b border-emerald-900/40">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">
              {t?.completed?.duration ?? "Время зарядки"}
            </span>
          </div>
          <div className="text-white text-2xl font-bold">
            {formatTime(sessionData.durationMinutes)}
          </div>
          <div className="text-gray-500 text-sm mt-0.5">
            {new Date(sessionData.startTime).toLocaleTimeString(
              getIntlLocale(locale),
              { hour: "2-digit", minute: "2-digit" },
            )}
            {" — "}
            {new Date(sessionData.endTime).toLocaleTimeString(
              getIntlLocale(locale),
              { hour: "2-digit", minute: "2-digit" },
            )}
          </div>
        </div>

        {/* Energy */}
        <div className="py-4 border-b border-emerald-900/40">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Battery className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">
              {t?.completed?.energy ?? "Переданная энергия"}
            </span>
          </div>
          <div className="text-white text-2xl font-bold">
            {sessionData.energyKwh.toFixed(2)} кВт⋅ч
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="py-4 border-b border-emerald-900/40">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">
              {t?.completed?.costBreakdown ?? "Списанная сумма"}
            </span>
          </div>
          <div className="space-y-2 text-white">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {t?.completed?.depositLabel ?? "Депозит"}
              </span>
              <span>{Math.round(sessionData.depositAmount)} сом</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {t?.completed?.chargingLabel ?? "Зарядка"} ({sessionData.durationMinutes} мин × {sessionData.pricePerMinute} сом)
              </span>
              <span>{Math.round(sessionData.chargeAmount)} сом</span>
            </div>
            <div className="border-t border-emerald-900/40 pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>{t?.completed?.totalLabel ?? "Итого"}</span>
              <span>{Math.round(sessionData.totalCost)} сом</span>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="py-4 border-b border-emerald-900/40 flex justify-between items-center">
          <span className="text-gray-400 text-sm">
            {t?.completed?.balanceAfter ?? "Баланс после списания"}
          </span>
          <span className="text-white text-xl font-bold">
            {Math.round(sessionData.balance)} сом
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6">
          <button
            onClick={() =>
              router.push(`/charging/receipt?invoiceId=${sessionData.invoiceId}`)
            }
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {t?.completed?.receiptButton ?? "Чек"}
          </button>

          <button
            onClick={() => router.push("/map")}
            className="w-full bg-[#0f2820] hover:bg-emerald-900/40 border border-emerald-900/40 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t?.completed?.homeButton ?? "На главную"}
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function CompletedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
          <div className="text-white text-xl">Загрузка...</div>
        </div>
      }
    >
      <CompletedContent />
    </Suspense>
  );
}
