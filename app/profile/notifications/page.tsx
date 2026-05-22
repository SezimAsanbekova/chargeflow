"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Lightbulb, Construction } from "lucide-react";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

export default function NotificationsPage() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "profile").then(setT);
  }, [locale]);

  const [notifications, setNotifications] = useState({
    charging: true,
    booking: true,
    payment: true,
    marketing: false,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/profile"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            {t?.notifications?.title ?? "Уведомления"}
          </h1>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3">
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Bell className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {t?.notifications?.charging?.title ?? "Зарядка"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t?.notifications?.charging?.subtitle ??
                      "Статус зарядной сессии"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("charging")}
                className={`relative w-14 h-8 rounded-full transition ${
                  notifications.charging ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.charging ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Bell className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {t?.notifications?.booking?.title ?? "Бронирования"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t?.notifications?.booking?.subtitle ??
                      "Напоминания о бронировании"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("booking")}
                className={`relative w-14 h-8 rounded-full transition ${
                  notifications.booking ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.booking ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Bell className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {t?.notifications?.payment?.title ?? "Платежи"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t?.notifications?.payment?.subtitle ??
                      "Информация о платежах"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("payment")}
                className={`relative w-14 h-8 rounded-full transition ${
                  notifications.payment ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.payment ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Bell className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {t?.notifications?.marketing?.title ?? "Акции и новости"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t?.notifications?.marketing?.subtitle ??
                      "Специальные предложения"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle("marketing")}
                className={`relative w-14 h-8 rounded-full transition ${
                  notifications.marketing ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    notifications.marketing ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb
              size={20}
              className="text-amber-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-gray-400 text-sm">
              {t?.notifications?.infoText ??
                "Уведомления помогут вам не пропустить важные события и своевременно получать информацию о зарядке вашего автомобиля."}
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3 justify-center">
            <Construction
              size={20}
              className="text-amber-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-gray-400 text-sm">
              {t?.notifications?.comingSoon ??
                "Настройки сохраняются локально. Синхронизация с сервером будет добавлена позже."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
