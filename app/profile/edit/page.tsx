"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, User, Mail, Phone, Check } from "lucide-react";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
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
    getTranslations(locale, "profile").then(setT);
  }, [locale]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setEditName(data.name || "");
          setEditEmail(data.email || session?.user?.email || "");
          setEditPhone(data.phone || "");
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
        <div className="text-white text-xl">
          {t?.edit?.loading ?? t?.loading ?? "Загрузка..."}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSaveProfile = async () => {
    setSaveError("");
    setSaveLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          // email не отправляем - его нельзя изменить
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            t?.edit?.errors?.saveFailed ||
            "Ошибка сохранения данных",
        );
      }

      // Успешно сохранено - возвращаемся назад
      router.push("/profile");
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
          <h1 className="text-2xl font-bold">
            {t?.edit?.title ?? "Личные данные"}
          </h1>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {saveError}
          </div>
        )}

        {/* Edit Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-white font-medium mb-3">
              {t?.edit?.nameLabel ?? "Имя"}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User className="text-emerald-400" size={20} />
              </div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t?.edit?.namePlaceholder ?? "Введите ваше имя"}
                className="w-full bg-[#0f2d26] border-2 border-emerald-900/30 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-white font-medium mb-3">
              {t?.edit?.emailLabel ?? "Email"}
              <span className="ml-2 text-xs text-gray-400">
                {t?.edit?.emailNote ?? "(нельзя изменить)"}
              </span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail className="text-gray-500" size={20} />
              </div>
              <input
                type="email"
                value={editEmail}
                readOnly
                disabled
                className="w-full bg-[#0a1f1a] border-2 border-emerald-900/20 rounded-xl pl-12 pr-4 py-4 text-gray-400 cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-white font-medium mb-3">
              {t?.edit?.phoneLabel ?? "Телефон"}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Phone className="text-emerald-400" size={20} />
              </div>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder={t?.edit?.phonePlaceholder ?? "+996 ___ ___ ___"}
                className="w-full bg-[#0f2d26] border-2 border-emerald-900/30 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={handleSaveProfile}
            disabled={saveLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg"
          >
            {saveLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t?.edit?.saving ?? "Сохранение..."}</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>{t?.edit?.saveButton ?? "Сохранить изменения"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
