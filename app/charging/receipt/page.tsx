"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";
import {
  getTranslations,
  getLocaleCookie,
  getIntlLocale,
  defaultLocale,
  type Locale,
} from "@/app/i18n";
import "@/app/balance/printer-receipt.css";

interface ReceiptData {
  invoiceId: string;
  sessionId: string;
  stationName: string;
  stationAddress: string;
  pricePerKwh: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  energyKwh: number;
  depositAmount: number;
  chargeAmount: number;
  totalCost: number;
}

function ReceiptContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
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
    const loadReceiptData = async () => {
      if (!invoiceId) {
        router.push("/map");
        return;
      }

      try {
        const response = await fetch(`/api/charging/invoice/${invoiceId}`);
        if (response.ok) {
          const data = await response.json();
          setReceiptData(data.receipt);
        } else {
          router.push("/map");
        }
      } catch (error) {
        console.error("Error loading receipt:", error);
        router.push("/map");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && invoiceId) {
      loadReceiptData();
    }
  }, [status, invoiceId, router]);

  useEffect(() => {
    if (receiptData && !loading) {
      const timer = setTimeout(() => setPrinterReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [receiptData, loading]);

  const downloadReceipt = async () => {
    const receiptElement = document.querySelector(".paper") as HTMLElement;
    if (!receiptElement) return;

    try {
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(receiptElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement("a");
      link.download = `receipt-${receiptData?.invoiceId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert(t?.receipt?.downloadError ?? "Ошибка при скачивании чека");
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

  if (!receiptData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-20">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t?.receipt?.title ?? "Чек"}</h1>
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Printer Receipt */}
      <div className="printer-container">
        <div className={`printer${printerReady ? ' show-receipt' : ''}`}>
          <span className="printer-name">ChargeFlow</span>
          <div className="signal"></div>
          <div className="mouth">
            <div className="paper">
              {/* Receipt Title */}
              <div className="receipt-title">ChargeFlow</div>
              <div className="receipt-subtitle">
                {t?.receipt?.subtitle ?? "Чек об оплате зарядки"}
              </div>
              <div className="receipt-date">
                {new Date(receiptData.startTime).toLocaleString(
                  getIntlLocale(locale),
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </div>

              <hr className="receipt-divider" />

              {/* Details */}
              <div className="payment-section">
                <div className="receipt-row">
                  <span className="label">#</span>
                  <span className="value">
                    {receiptData.invoiceId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="receipt-row">
                  <span className="label">
                    {t?.receipt?.station ?? "Станция"}
                  </span>
                  <span className="value">{receiptData.stationName}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">
                    {t?.receipt?.duration ?? "Время"}
                  </span>
                  <span className="value">
                    {formatTime(receiptData.durationMinutes)}
                  </span>
                </div>
                <div className="receipt-row">
                  <span className="label">
                    {t?.receipt?.energy ?? "Энергия"}
                  </span>
                  <span className="value">
                    {receiptData.energyKwh.toFixed(2)} кВт⋅ч
                  </span>
                </div>
                <div className="receipt-row">
                  <span className="label">
                    {t?.receipt?.deposit ?? "Депозит"}
                  </span>
                  <span className="value">
                    {Math.round(receiptData.depositAmount)} сом
                  </span>
                </div>
                <div className="receipt-row">
                  <span className="label">
                    {t?.receipt?.minuteCharge ?? "Зарядка"}
                  </span>
                  <span className="value">
                    {Math.round(receiptData.chargeAmount)} сом
                  </span>
                </div>
              </div>

              <hr className="receipt-divider" />

              {/* Total */}
              <div className="receipt-total negative">
                -{Math.round(receiptData.totalCost)} сом
              </div>

              <div className="receipt-footer">
                {t?.receipt?.footerThanks ?? "Спасибо за использование ChargeFlow!"}
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
          {t?.receipt?.downloadButton ?? "Скачать чек"}
        </button>

        <button
          onClick={() => router.push("/map")}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-semibold transition"
        >
          {t?.receipt?.closeButton ?? "Закрыть"}
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
          <div className="text-white text-xl">Загрузка...</div>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
