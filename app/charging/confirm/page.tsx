"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Plug,
  Zap,
  DollarSign,
  Wallet,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

interface Station {
  id: string;
  name: string;
  address: string;
}

interface Connector {
  id: string;
  type: string;
  powerKw: number;
  pricePerKwh: number;
  pricePerMinute: number;
  status: string;
}

export default function ConfirmChargingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [station, setStation] = useState<Station | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [chargingDeadline, setChargingDeadline] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  const stationId = searchParams.get("stationId");
  const connectorId = searchParams.get("connectorId");
  const bookingId = searchParams.get("bookingId");

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
    if (status === "authenticated" && stationId && connectorId) {
      loadData();
    }
  }, [status, stationId, connectorId]);

  const loadData = async () => {
    try {
      // Загружаем данные станции
      const stationResponse = await fetch(`/api/stations/${stationId}`);
      if (stationResponse.ok) {
        const stationData = await stationResponse.json();
        setStation(stationData);

        // Находим выбранный коннектор
        const selectedConnector = stationData.connectors?.find(
          (c: Connector) => c.id === connectorId,
        );
        if (selectedConnector) {
          setConnector(selectedConnector);
        }
      }

      // Загружаем баланс пользователя
      const balanceResponse = await fetch("/api/user/balance");
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setUserBalance(balanceData.balance || 0);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError(t?.confirm?.errors?.loadError ?? "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const handleStartCharging = async () => {
    if (!station || !connector) return;

    // Проверяем минимальный баланс
    if (userBalance < 50) {
      setError(
        t?.confirm?.errors?.insufficientFunds ??
          "Недостаточно средств. Минимум для начала зарядки: 50 сом",
      );
      return;
    }

    setStarting(true);
    setError("");

    try {
      // Пытаемся получить активный автомобиль (необязательно)
      const vehiclesResponse = await fetch("/api/vehicles");
      let vehicleId = null;

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        const activeVehicle = vehiclesData.vehicles?.find(
          (v: any) => v.isActive,
        );
        if (activeVehicle) {
          vehicleId = activeVehicle.id;
        } else if (vehiclesData.vehicles?.length > 0) {
          // Если нет активного, берём первый автомобиль
          vehicleId = vehiclesData.vehicles[0].id;
        }
      }

      const response = await fetch("/api/charging/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId: connector.id,
          vehicleId: vehicleId, // Может быть null
          bookingId: bookingId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Если есть дедлайн — показываем уведомление перед переходом
        if (data.session?.chargingDeadline) {
          const deadline = new Date(data.session.chargingDeadline);
          const timeStr = deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          alert(
            (t?.confirm?.deadlineWarning ?? 'Внимание! Следующее бронирование в {time}. Зарядка автоматически остановится в {stop}.')
              .replace('{time}', timeStr)
              .replace('{stop}', timeStr)
          );
        }
        router.push("/charging");
      } else {
        setError(
          data.error ||
            (t?.confirm?.errors?.startError ?? "Ошибка при начале зарядки"),
        );
      }
    } catch (error) {
      console.error("Error starting charging:", error);
      setError(t?.confirm?.errors?.startError ?? "Ошибка при начале зарядки");
    } finally {
      setStarting(false);
    }
  };

  const formatConnectorType = (type: string): string => {
    if (type === "GB_T") return "GB/T";
    return type;
  };

  // Безопасное вычисление примерного времени
  const estimatedMinutes = useMemo(() => {
    if (!connector) return 0;

    const price = Number(connector.pricePerMinute);
    const balance = Number(userBalance);

    // Проверяем, что оба значения валидны
    if (isNaN(price) || isNaN(balance) || price <= 0) {
      return 0;
    }

    return Math.floor(balance / price);
  }, [connector, userBalance]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">{t?.loading ?? "Загрузка..."}</div>
      </div>
    );
  }

  if (!station || !connector) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            {t?.confirm?.notFound ?? "Данные не найдены"}
          </div>
          <Link
            href="/map"
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            {t?.confirm?.backToMap ?? "Вернуться на карту"}
          </Link>
        </div>
      </div>
    );
  }

  const hasEnoughBalance = userBalance >= 50;

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 text-white p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">
            {t?.confirm?.title ?? "Начать зарядку"}
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle
              className="text-red-400 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Station Info */}
        <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="text-emerald-400" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg mb-1">
                {station.name}
              </h2>
              <p className="text-gray-400 text-sm">{station.address}</p>
            </div>
          </div>
        </div>

        {/* Connector Info */}
        <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Plug className="text-emerald-400" size={18} />
            {t?.confirm?.connectorSection ?? "Выбранный коннектор"}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                {t?.confirm?.connectorType ?? "Тип разъёма"}
              </span>
              <span className="text-white font-semibold">
                {formatConnectorType(connector.type)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                {t?.confirm?.power ?? "Мощность"}
              </span>
              <span className="text-white font-semibold flex items-center gap-1">
                <Zap className="text-emerald-400" size={16} />
                {connector.powerKw} кВт
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                {t?.confirm?.pricePerMin ?? "Цена за минуту"}
              </span>
              <span className="text-emerald-400 font-bold text-lg">
                {connector.pricePerMinute
                  ? Number(connector.pricePerMinute).toFixed(2)
                  : "0.00"}{" "}
                сом/мин
              </span>
            </div>
          </div>
        </div>

        {/* Balance Info */}
        <div
          className={`border-2 rounded-xl p-4 ${
            hasEnoughBalance
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Wallet
              className={hasEnoughBalance ? "text-emerald-400" : "text-red-400"}
              size={18}
            />
            {t?.confirm?.balanceSection ?? "Ваш баланс"}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                {t?.confirm?.currentBalance ?? "Текущий баланс"}
              </span>
              <span
                className={`font-bold text-xl ${hasEnoughBalance ? "text-white" : "text-red-400"}`}
              >
                {Math.round(userBalance)} сом
              </span>
            </div>
            {hasEnoughBalance && estimatedMinutes > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {t?.confirm?.estimatedTime ?? "Хватит примерно на"}
                </span>
                <span className="text-emerald-400 font-semibold">
                  ~{estimatedMinutes} {t?.confirm?.minutes ?? "мин"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connector Busy Warning */}
        {connector.status !== "available" && (
          <div className="bg-red-500/10 border-2 border-red-500/40 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-400 font-semibold text-sm">
                {t?.confirm?.connectorBusy ?? "Станция занята. Дождитесь окончания зарядки."}
              </p>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="text-yellow-400 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <h4 className="text-yellow-400 font-semibold text-sm mb-1">
                {t?.confirm?.warningTitle ?? "Важно знать"}
              </h4>
              <p className="text-gray-300 text-sm">
                {(
                  t?.confirm?.warningText ??
                  "С вашего баланса будет списываться {price} сом каждую минуту во время зарядки."
                ).replace(
                  "{price}",
                  connector.pricePerMinute
                    ? Number(connector.pricePerMinute).toFixed(2)
                    : "0.00",
                )}
              </p>
              {!hasEnoughBalance && (
                <p className="text-red-400 text-sm mt-2 font-semibold">
                  {t?.confirm?.minBalanceWarning ??
                    "Минимальный баланс для начала зарядки: 50 сом"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {!hasEnoughBalance && (
            <Link
              href="/balance"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <Wallet size={20} />
              {t?.confirm?.topUpButton ?? "Пополнить баланс"}
            </Link>
          )}

          <button
            onClick={handleStartCharging}
            disabled={!hasEnoughBalance || starting || connector.status !== "available"}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            {starting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t?.confirm?.starting ?? "Запуск..."}</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>{t?.confirm?.startButton ?? "Начать зарядку"}</span>
              </>
            )}
          </button>

          <button
            onClick={() => router.back()}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl font-semibold transition"
          >
            {t?.confirm?.backButton ?? "Назад"}
          </button>
        </div>
      </div>
    </div>
  );
}
