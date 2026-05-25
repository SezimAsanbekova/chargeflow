"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getTranslations,
  getLocaleCookie,
  getIntlLocale,
  defaultLocale,
  type Locale,
} from "@/app/i18n";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  X,
  AlertCircle,
  Zap,
  Battery,
  Play,
} from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";

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
  status: "active" | "completed" | "cancelled" | "expired";
  depositAmount: number;
  depositStatus: "held" | "returned" | "lost";
  cancelDeadline: string;
  createdAt: string;
}

interface ChargingSession {
  id: string;
  station: {
    name: string;
    address: string;
  };
  connector: {
    type: string;
    powerKw: number;
  };
  startTime: string;
  endTime: string | null;
  energyKwh: number;
  costTotal: number;
  status: "active" | "completed" | "cancelled";
}

type TabType = "bookings" | "sessions";

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chargingSessions, setChargingSessions] = useState<ChargingSession[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

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
    getTranslations(locale, "bookings").then(setT);
  }, [locale]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем бронирования
        const bookingsResponse = await fetch("/api/user/bookings");
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData);
        }

        // Загружаем историю зарядок
        const sessionsResponse = await fetch("/api/user/charging-history");
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setChargingSessions(sessionsData.sessions || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();

      // Автоматически обновляем каждые 30 секунд
      const interval = setInterval(() => {
        fetchData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session]);

  const calculateEndTime = (startTime: string) => {
    const start = new Date(startTime);
    return start.toLocaleTimeString(getIntlLocale(locale), {
      hour: "2-digit",
      minute: "2-digit",
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
    return date.toLocaleDateString(getIntlLocale(locale), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(getIntlLocale(locale), {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canCancelBooking = (booking: Booking) => {
    if (booking.status !== "active") return false;

    const cancelDeadline = new Date(booking.cancelDeadline);
    const now = new Date();

    return now < cancelDeadline;
  };

  // Водитель может начать зарядку: бронирование активно и время наступило (до +15 мин)
  const canStartCharging = (booking: Booking) => {
    if (booking.status !== "active") return false;
    const now = new Date();
    const start = new Date(booking.startTime);
    const deadline = new Date(start.getTime() + 15 * 60 * 1000);
    return now >= start && now < deadline;
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    setCancelling(true);

    try {
      const response = await fetch("/api/user/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingToCancel.id,
          action: "cancel",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при отмене бронирования");
      }

      // Обновляем статус бронирования в локальном состоянии
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingToCancel.id
            ? {
                ...booking,
                status: "cancelled" as const,
                depositStatus: "returned" as const,
              }
            : booking,
        ),
      );

      alert("✅ Бронирование отменено. Депозит возвращен на ваш баланс.");
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
      case "active":
        return t?.bookings?.status?.active ?? "Активно";
      case "completed":
        return t?.bookings?.status?.completed ?? "Завершено";
      case "cancelled":
        return t?.bookings?.status?.cancelled ?? "Отменено";
      case "expired":
        return t?.bookings?.status?.expired ?? "Истекло";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-emerald-400 bg-emerald-500/20";
      case "completed":
        return "text-blue-400 bg-blue-500/20";
      case "cancelled":
        return "text-red-400 bg-red-500/20";
      case "expired":
        return "text-gray-400 bg-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">{t?.loading ?? "Загрузка..."}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const activeBookings = bookings.filter((b) => b.status === "active");
  const pastBookings = bookings.filter((b) => b.status !== "active");

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/profile"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ArrowLeft className="text-emerald-400" size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{t?.title ?? "История"}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 py-3 rounded-lg font-medium transition ${
              activeTab === "bookings"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t?.tabs?.bookings ?? "Бронирования"}
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex-1 py-3 rounded-lg font-medium transition ${
              activeTab === "sessions"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t?.tabs?.sessions ?? "Зарядки"}
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <>
            {/* Active Bookings */}
            {activeBookings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-emerald-400 mb-4">
                  {t?.bookings?.activeSectionTitle ?? "Активные бронирования"}
                </h2>
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {booking.station.name}
                          </h3>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <MapPin size={14} />
                            {booking.station.address}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                        >
                          {getStatusText(booking.status)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Calendar size={14} />
                            {t?.bookings?.details?.dateLabel ?? "Дата"}
                          </div>
                          <div className="text-white font-medium">
                            {formatDate(booking.startTime)}
                          </div>
                        </div>
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Clock size={14} />
                            {t?.bookings?.details?.timeLabel ?? "Время"}
                          </div>
                          <div className="text-white font-medium">
                            {formatTime(booking.startTime)} –{" "}
                            {calculateEndTime(booking.endTime)}
                          </div>
                        </div>
                      </div>

                      {/* Connector Info */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="text-gray-400 text-sm mb-1">
                            {t?.bookings?.details?.connectorLabel ??
                              "Коннектор"}
                          </div>
                          <div className="text-white font-medium">
                            {booking.connector.type}
                          </div>
                        </div>
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="text-gray-400 text-sm mb-1">
                            {t?.bookings?.details?.powerLabel ?? "Мощность"}
                          </div>
                          <div className="text-white font-medium">
                            {booking.connector.powerKw} кВт
                          </div>
                        </div>
                      </div>

                      {/* Deposit Info */}
                      <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                            <svg
                              className="w-5 h-5 text-emerald-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">
                              {t?.bookings?.details?.depositLabel ?? "Депозит:"}{" "}
                              {booking.depositAmount} сом
                              {booking.depositStatus === "returned" && (
                                <span className="text-emerald-400 ml-2">
                                  {t?.bookings?.details?.depositReturned ??
                                    "(возвращен)"}
                                </span>
                              )}
                              {booking.depositStatus === "held" && (
                                <span className="text-gray-400 ml-2">
                                  {t?.bookings?.details?.depositHeld ??
                                    "(заблокирован)"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        {canStartCharging(booking) ? (
                          <Link
                            href={`/charging/confirm?stationId=${booking.station.id}&connectorId=${booking.connector.id}&bookingId=${booking.id}`}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition text-center flex items-center justify-center gap-2"
                          >
                            <Play size={16} />
                            {t?.bookings?.actions?.startCharging ?? "Начать зарядку"}
                          </Link>
                        ) : (
                          <Link
                            href={`/map?stationId=${booking.station.id}`}
                            className="flex-1 bg-emerald-500/60 text-white py-3 rounded-lg font-medium transition text-center"
                          >
                            {t?.bookings?.actions?.goToStation ??
                              "Перейти к станции"}
                          </Link>
                        )}
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => {
                              setBookingToCancel(booking);
                              setShowCancelModal(true);
                            }}
                            className="px-6 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 py-3 rounded-lg font-medium transition"
                          >
                            {t?.bookings?.actions?.cancelButton ?? "Отменить"}
                          </button>
                        )}
                      </div>

                      {/* Cancel Warning */}
                      {!canCancelBooking(booking) &&
                        booking.status === "active" && (
                          <div className="mt-3 text-gray-400 text-xs flex items-center gap-1">
                            <AlertCircle size={12} />
                            {t?.bookings?.actions?.cancelWarning ??
                              "Отмена возможна не позднее чем за 30 минут до начала"}
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
                <h2 className="text-lg font-semibold text-gray-400 mb-4 text-center">
                  {t?.bookings?.historySectionTitle ?? "История бронирований"}
                </h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6 opacity-75"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {booking.station.name}
                          </h3>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <MapPin size={14} />
                            {booking.station.address}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                        >
                          {getStatusText(booking.status)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Calendar size={14} />
                            {t?.bookings?.details?.dateLabel ?? "Дата"}
                          </div>
                          <div className="text-white font-medium">
                            {formatDate(booking.startTime)}
                          </div>
                        </div>
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Clock size={14} />
                            {t?.bookings?.details?.timeLabel ?? "Время"}
                          </div>
                          <div className="text-white font-medium">
                            {formatTime(booking.startTime)} –{" "}
                            {calculateEndTime(booking.endTime)}
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
                <h3 className="text-xl font-bold text-white mb-2">
                  {t?.bookings?.empty?.title ?? "Нет бронирований"}
                </h3>
                <p className="text-gray-400 mb-6">
                  {t?.bookings?.empty?.description ??
                    "У вас пока нет активных или завершенных бронирований"}
                </p>
                <Link
                  href="/map"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  <MapPin size={20} />
                  {t?.bookings?.empty?.findStationButton ?? "Найти станцию"}
                </Link>
              </div>
            )}
          </>
        )}

        {/* Charging Sessions Tab */}
        {activeTab === "sessions" && (
          <>
            {chargingSessions.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-400 mb-4 text-center">
                  {t?.sessions?.historySectionTitle ?? "История зарядок"}
                </h2>
                <div className="space-y-4">
                  {chargingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {session.station.name}
                          </h3>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <MapPin size={14} />
                            {session.station.address}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            session.status === "completed"
                              ? "text-emerald-400 bg-emerald-500/20"
                              : session.status === "active"
                                ? "text-blue-400 bg-blue-500/20"
                                : "text-gray-400 bg-gray-500/20"
                          }`}
                        >
                          {session.status === "completed"
                            ? (t?.sessions?.status?.completed ?? "Завершено")
                            : session.status === "active"
                              ? (t?.sessions?.status?.active ?? "Активно")
                              : (t?.sessions?.status?.cancelled ?? "Отменено")}
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Calendar size={14} />
                            {t?.bookings?.details?.dateLabel ?? "Дата"}
                          </div>
                          <div className="text-white font-medium">
                            {formatDate(session.startTime)}
                          </div>
                        </div>
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Clock size={14} />
                            {t?.bookings?.details?.timeLabel ?? "Время"}
                          </div>
                          <div className="text-white font-medium">
                            {formatTime(session.startTime)}
                            {session.endTime &&
                              ` – ${formatTime(session.endTime)}`}
                          </div>
                        </div>
                      </div>

                      {/* Charging Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Battery size={14} />
                            {t?.sessions?.details?.energyLabel ?? "Энергия"}
                          </div>
                          <div className="text-white font-medium">
                            {session.energyKwh.toFixed(2)} кВт⋅ч
                          </div>
                        </div>
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Zap size={14} />
                            {t?.bookings?.details?.powerLabel ?? "Мощность"}
                          </div>
                          <div className="text-white font-medium">
                            {session.connector.powerKw} кВт
                          </div>
                        </div>
                      </div>

                      {/* Cost and Connector */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="text-gray-400 text-sm mb-1">
                            {t?.bookings?.details?.connectorLabel ??
                              "Коннектор"}
                          </div>
                          <div className="text-white font-medium">
                            {session.connector.type}
                          </div>
                        </div>
                        <div className="bg-[#0a1f1a] rounded-lg p-3">
                          <div className="text-gray-400 text-sm mb-1">
                            {t?.sessions?.details?.costLabel ?? "Стоимость"}
                          </div>
                          <div className="text-emerald-400 font-bold text-lg">
                            {Math.round(session.costTotal)} сом
                          </div>
                        </div>
                      </div>

                      {/* Session ID */}
                      <div className="mt-4 pt-4 border-t border-emerald-900/30">
                        <div className="text-gray-400 text-xs">
                          {t?.sessions?.sessionPrefix ?? "Сессия:"}{" "}
                          {session.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="text-emerald-400" size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t?.sessions?.empty?.title ?? "Нет зарядок"}
                </h3>
                <p className="text-gray-400 mb-6">
                  {t?.sessions?.empty?.description ??
                    "У вас пока нет истории зарядок"}
                </p>
                <Link
                  href="/map"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  <MapPin size={20} />
                  {t?.sessions?.empty?.findStationButton ?? "Начать зарядку"}
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && bookingToCancel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-400">
                {t?.cancelModal?.title ?? "Отменить бронирование"}
              </h2>
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
              <h3 className="text-white font-medium mb-2">
                {bookingToCancel.station.name}
              </h3>
              <div className="text-gray-400 text-sm space-y-1">
                <div>📍 {bookingToCancel.station.address}</div>
                <div>📅 {formatDate(bookingToCancel.startTime)}</div>
                <div>
                  ⏰ {formatTime(bookingToCancel.startTime)} –{" "}
                  {calculateEndTime(bookingToCancel.endTime)}
                </div>
                <div>
                  🔌 {bookingToCancel.connector.type} (
                  {bookingToCancel.connector.powerKw} кВт)
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">
                    {`${t?.cancelModal?.depositInfo?.replace("{amount}", bookingToCancel.depositAmount) ?? `Депозит ${bookingToCancel.depositAmount} сом будет возвращен на ваш баланс`}`}
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
                {t?.cancelModal?.backButton ?? "Назад"}
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
              >
                {cancelling
                  ? (t?.cancelModal?.cancelling ?? "Отмена...")
                  : (t?.cancelModal?.cancelButton ?? "Отменить бронь")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
