"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

function ErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "auth").then(setT);
  }, [locale]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    setError(errorParam || "Default");
  }, [searchParams]);

  const messages = t?.error?.messages ?? {};
  const errorMessage =
    messages[error] ??
    messages["Default"] ??
    "Произошла неизвестная ошибка. Попробуйте снова.";

  return (
    <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#0f2d26] border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {t?.error?.title ?? "Ошибка авторизации"}
        </h1>
        <p className="text-gray-400 mb-6">{errorMessage}</p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition"
          >
            {t?.error?.retryButton ?? "Попробовать снова"}
          </Link>
          <Link
            href="/"
            className="block w-full bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-gray-300 py-3 rounded-lg font-semibold transition border border-emerald-900/30"
          >
            {t?.error?.backToHome ?? "Вернуться на главную"}
          </Link>
        </div>

        {error && error !== "Default" && (
          <div className="mt-6 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-500">
              {t?.error?.errorCodePrefix ?? "Код ошибки:"} {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
          <div className="text-white">Загрузка...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
