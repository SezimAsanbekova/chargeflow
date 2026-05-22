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
  Download,
  CalendarClock,
} from "lucide-react";
import "@/app/balance/printer-receipt.css";
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
  invoiceId?: string;
}

function StoppedContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const reason = searchParams.get("reason");
  const [sessionData, setSessionData] = useState<StoppedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [printerReady, setPrinterReady] = useState(false);
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
            balance: data.session.balance || 0,
            invoiceId: data.session.invoiceId,
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

  useEffect(() => {
    if (sessionData && !loading) {
      const timer = setTimeout(() => setPrinterReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [sessionData, loading]);

  const downloadReceipt = async () => {
    const el = document.querySelector(".paper") as HTMLElement;
    if (!el) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `receipt-${sessionData?.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error(e);
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

  if (!sessionData) {
    return null;
  }

  const isBookingDeadline = reason === "booking_deadline";

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-b ${isBookingDeadline ? "from-amber-600 to-amber-500" : "from-red-600 to-red-500"} text-white p-8 text-center`}>
        {isBookingDeadline ? (
          <CalendarClock className="w-20 h-20 mx-auto mb-4" />
        ) : (
          <AlertCircle className="w-20 h-20 mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-bold mb-2">
          {t?.stopped?.title ?? "Зарядка остановлена"}
        </h1>
        <p className={`${isBookingDeadline ? "text-amber-100" : "text-red-100"} text-sm`}>
          {isBookingDeadline
            ? (t?.stopped?.reasonBooking ?? "Время вышло — станция забронирована другим пользователем")
            : (t?.stopped?.reason ?? "Недостаточно средств на балансе")}
        </p>
      </div>

      {/* Printer Receipt */}
      <div className="printer-container">
        <div className={`printer${printerReady ? " show-receipt" : ""}`}>
          <span className="printer-name">ChargeFlow</span>
          <div className="signal"></div>
          <div className="mouth">
            <div className="paper">
              <div className="receipt-title">ChargeFlow</div>
              <div className="receipt-subtitle">
                {isBookingDeadline
                  ? (t?.stopped?.receiptSubtitleBooking ?? "Зарядка завершена по брони")
                  : (t?.stopped?.receiptSubtitle ?? "Зарядка остановлена")}
              </div>

              <hr className="receipt-divider" />

              <div className="payment-section">
                <div className="receipt-row">
                  <span className="label">#</span>
                  <span className="value">{sessionData.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">{t?.stopped?.stationLabel ?? "Станция"}</span>
                  <span className="value">{sessionData.stationName}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">{t?.stopped?.duration ?? "Время"}</span>
                  <span className="value">{formatTime(sessionData.durationMinutes)}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">{t?.stopped?.energy ?? "Энергия"}</span>
                  <span className="value">{sessionData.energyKwh.toFixed(2)} кВт⋅ч</span>
                </div>
              </div>

              <hr className="receipt-divider" />

              <div className="receipt-total negative">
                -{Math.round(sessionData.totalCost)} сом
              </div>

              <div className="receipt-footer">
                {isBookingDeadline
                  ? (t?.stopped?.footerBooking ?? "Спасибо! Следующий водитель уже ждёт.")
                  : (t?.stopped?.footerFunds ?? "Пополните баланс для продолжения.")}
                <br />
                support@chargeflow.kg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 mt-8 space-y-3">
        <button
          onClick={downloadReceipt}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          {t?.stopped?.downloadButton ?? "Скачать чек"}
        </button>

        {!isBookingDeadline && (
          <button
            onClick={() => router.push("/balance")}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {t?.stopped?.topUpButton ?? "Пополнить баланс"}
          </button>
        )}

        <button
          onClick={() => router.push("/map")}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          {t?.stopped?.homeButton ?? "На главную"}
        </button>
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
