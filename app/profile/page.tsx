"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  FileText,
  Bell,
  Trash2,
  LogOut,
  ChevronRight,
  Car,
  Eye,
  EyeOff,
  X,
  Calendar,
  User,
  Globe,
} from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";
import {
  getTranslations,
  getLocaleCookie,
  setLocaleCookie,
  defaultLocale,
  localeNames,
  localeFlags,
  locales,
  type Locale,
} from "@/app/i18n";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [t, setT] = useState<any>(null);

  // Восстановление языка из cookie при загрузке
  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  // Загрузка переводов при изменении языка
  useEffect(() => {
    getTranslations(locale, "profile").then((translations) => {
      setT(translations);
    });
  }, [locale]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleCookie(newLocale);
    setShowLangMenu(false);
    // Перезагрузка не нужна — locale state меняется → useEffect грузит новые переводы
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session]);

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

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError(
        t?.deleteModal?.errors?.noPassword ??
          "Введите пароль для подтверждения",
      );
      return;
    }

    setDeleteError("");
    setDeleteLoading(true);

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка удаления аккаунта");
      }

      await signOut({ callbackUrl: "/" });
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            {userData?.name ||
              session?.user?.name ||
              session?.user?.email?.split("@")[0] ||
              "Пользователь"}
          </h1>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {/* Edit Profile */}
          <Link
            href="/profile/edit"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <User className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t?.menu?.personalData?.title ?? "Личные данные"}
                </p>
                <p className="text-gray-400 text-sm">
                  {t?.menu?.personalData?.subtitle ?? "Имя, email, телефон"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* My Bookings */}
          <Link
            href="/bookings"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Calendar className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t?.menu?.myBookings?.title ?? "Мои брони"}
                </p>
                <p className="text-gray-400 text-sm">
                  {t?.menu?.myBookings?.subtitle ?? "Активные бронирования"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* My Vehicles */}
          <Link
            href="/vehicles"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Car className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t?.menu?.myVehicles?.title ?? "Мои автомобили"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* Charging History */}
          <Link
            href="/charging/history"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <History className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t?.menu?.chargingHistory?.title ?? "История зарядок"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* Charging Rules */}
          <Link
            href="/charging/rules"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <FileText className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t?.menu?.chargingRules?.title ?? "Правила зарядок"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* Notifications */}
          <Link
            href="/profile/notifications"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Bell className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t?.menu?.notifications?.title ?? "Уведомления"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">
                {t?.menu?.notifications?.status ?? "Вкл"}
              </span>
              <ChevronRight className="text-gray-400" size={24} />
            </div>
          </Link>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="w-full flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Globe className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-white font-medium">Язык / Тил</p>
                  <p className="text-gray-400 text-sm">
                    {localeFlags[locale]} {localeNames[locale]}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`text-gray-400 transition-transform duration-200 ${
                  showLangMenu ? "rotate-90" : ""
                }`}
                size={24}
              />
            </button>

            {showLangMenu && (
              <div className="mt-1 rounded-xl overflow-hidden border border-emerald-500/30 bg-[#0a1f1a]">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLocaleChange(l)}
                    className={`w-full flex items-center gap-4 px-4 py-3 transition ${
                      l === locale
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-gray-300 hover:bg-emerald-500/10"
                    }`}
                  >
                    <span className="text-2xl">{localeFlags[l]}</span>
                    <span className="font-medium">{localeNames[l]}</span>
                    {l === locale && (
                      <svg
                        className="w-5 h-5 ml-auto text-emerald-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between bg-[#0f2d26] border border-red-900/30 rounded-xl p-4 hover:border-red-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-400" size={24} />
              </div>
              <div>
                <p className="text-red-400 font-medium">
                  {t?.menu?.deleteAccount?.title ?? "Удалить аккаунт"}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-4 rounded-full font-medium transition"
          >
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <LogOut size={24} />
            </div>
            <span className="text-lg">{t?.logout ?? "Выход"}</span>
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-red-400">
                {t?.deleteModal?.title ?? "Удалить аккаунт"}
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">
                {t?.deleteModal?.warning ??
                  "⚠️ Внимание! Это действие необратимо. Все ваши данные будут удалены:"}
              </p>
              <ul className="text-red-400 text-sm mt-2 ml-4 list-disc">
                {(
                  t?.deleteModal?.dataList ?? [
                    "Профиль и настройки",
                    "История зарядок",
                    "Автомобили",
                    "Бронирования",
                    "Баланс",
                  ]
                ).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Error Message */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {deleteError}
              </div>
            )}

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 text-sm">
                {t?.deleteModal?.passwordLabel ??
                  "Введите пароль для подтверждения"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={
                    t?.deleteModal?.passwordPlaceholder ?? "Ваш пароль"
                  }
                  className="w-full bg-[#0a1f1a] border border-red-900/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  disabled={deleteLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="flex-1 bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-gray-300 py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                {t?.deleteModal?.cancelButton ?? "Отмена"}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
              >
                {deleteLoading
                  ? (t?.deleteModal?.deleting ?? "Удаление...")
                  : (t?.deleteModal?.deleteButton ?? "Удалить")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
