"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Download, X, CheckCircle } from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";
import {
  getTranslations,
  getLocaleCookie,
  getIntlLocale,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

interface ReceiptData {
  invoiceId: string;
  sessionId: string;
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
}

function ReceiptContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
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

  const downloadReceipt = async () => {
    const receiptElement = document.getElementById("receipt-content");
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
      <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8" />
          <h1 className="text-2xl font-bold">{t?.receipt?.title ?? "Чек"}</h1>
        </div>
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Receipt */}
      <div className="p-6">
        <div id="receipt-content" className="bg-white rounded-lg p-6 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-800">ChargeFlow</h2>
            </div>
            <p className="text-sm text-gray-600">
              {t?.receipt?.subtitle ?? "Чек об оплате зарядки"}
            </p>
          </div>

          {/* Receipt Number */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-1">
              {t?.receipt?.receiptNumber ?? "Номер чека"}
            </div>
            <div className="font-mono text-sm text-gray-800">
              {receiptData.invoiceId.toUpperCase()}
            </div>
          </div>

          {/* Date and Time */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-1">
              {t?.receipt?.dateTime ?? "Дата и время сессии"}
            </div>
            <div className="text-sm text-gray-800">
              {new Date(receiptData.startTime).toLocaleString(
                getIntlLocale(locale),
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
              {" - "}
              {new Date(receiptData.endTime).toLocaleString(
                getIntlLocale(locale),
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
            </div>
          </div>

          {/* Station Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="text-xs text-gray-500 mb-1">
              {t?.receipt?.station ?? "Станция"}
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {receiptData.stationName}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {receiptData.stationAddress}
            </div>
          </div>

          {/* Charging Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t?.receipt?.pricePerMin ?? "Цена за минуту"}
              </span>
              <span className="text-gray-800 font-semibold">
                {receiptData.pricePerMinute} сом/мин
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t?.receipt?.duration ?? "Время зарядки"}
              </span>
              <span className="text-gray-800 font-semibold">
                {formatTime(receiptData.durationMinutes)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t?.receipt?.energy ?? "Переданная энергия"}
              </span>
              <span className="text-gray-800 font-semibold">
                {receiptData.energyKwh.toFixed(2)} кВт⋅ч
              </span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t?.receipt?.deposit ?? "Депозит"}
              </span>
              <span className="text-gray-800">
                {Math.round(receiptData.depositAmount)} сом
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t?.receipt?.minuteCharge ?? "Поминутное списание"}
              </span>
              <span className="text-gray-800">
                {Math.round(receiptData.chargeAmount)} сом
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">
                {t?.receipt?.total ?? "Итого"}
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                {Math.round(receiptData.totalCost)} сом
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-1">
              {t?.receipt?.paymentMethod ?? "Способ оплаты"}
            </div>
            <div className="text-sm text-gray-800">
              {t?.receipt?.paymentMethodValue ?? "Баланс"}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t-2 border-dashed border-gray-300">
            <p className="text-xs text-gray-500">
              {t?.receipt?.footerThanks ??
                "Спасибо за использование ChargeFlow!"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t?.receipt?.sessionPrefix ?? "Номер сессии:"}{" "}
              {receiptData.sessionId.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={downloadReceipt}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t?.receipt?.downloadButton ?? "Скачать чек"}
          </button>

          <button
            onClick={() => router.push("/map")}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-semibold transition-colors"
          >
            {t?.receipt?.closeButton ?? "Закрыть"}
          </button>
        </div>
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
