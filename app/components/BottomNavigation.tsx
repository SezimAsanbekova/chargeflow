"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Wallet, History, MoreHorizontal, Sparkles } from "lucide-react";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "common").then(setT);
  }, [locale]);

  const getActiveTab = () => {
    if (pathname === "/map" || pathname === "/") return "map";
    if (pathname === "/balance") return "balance";
    if (pathname === "/ai-chat") return "ai";
    if (
      pathname.startsWith("/bookings") ||
      pathname.startsWith("/charging/history")
    )
      return "history";
    if (
      pathname.startsWith("/profile") ||
      pathname.startsWith("/vehicles") ||
      pathname.startsWith("/charging/rules")
    )
      return "more";
    return "";
  };

  const activeTab = getActiveTab();

  return (
    <>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f2d26] border-t border-emerald-900/30 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {/* Главная */}
            <button
              onClick={() => router.push("/map")}
              className="flex flex-col items-center gap-1 min-w-[52px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "map" ? "bg-emerald-500/20" : ""}`}
              >
                <Home
                  size={22}
                  className={activeTab === "map" ? "text-emerald-400" : "text-white"}
                />
              </div>
              <span
                className={`text-xs ${activeTab === "map" ? "text-emerald-400 font-medium" : "text-white"}`}
              >
                {t?.bottomNav?.home ?? "Главная"}
              </span>
            </button>

            {/* Кошелек */}
            <button
              onClick={() => router.push("/balance")}
              className="flex flex-col items-center gap-1 min-w-[52px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "balance" ? "bg-emerald-500/20" : ""}`}
              >
                <Wallet
                  size={22}
                  className={activeTab === "balance" ? "text-emerald-400" : "text-white"}
                />
              </div>
              <span
                className={`text-xs ${activeTab === "balance" ? "text-emerald-400 font-medium" : "text-white"}`}
              >
                {t?.bottomNav?.wallet ?? "Кошелек"}
              </span>
            </button>

            {/* AI Chat — центральная кнопка */}
            <button
              onClick={() => router.push("/ai-chat")}
              className="flex flex-col items-center gap-1 -mt-5"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 border-4 border-[#0f2d26] ${
                activeTab === "ai"
                  ? "bg-emerald-400 shadow-emerald-400/50"
                  : "bg-emerald-500 shadow-emerald-500/40 hover:bg-emerald-400 active:scale-95"
              }`}>
                <Sparkles size={24} className="text-white" />
              </div>
              <span className={`text-xs font-medium ${
                activeTab === "ai" ? "text-emerald-300" : "text-emerald-400"
              }`}>AI</span>
            </button>

            {/* История */}
            <button
              onClick={() => router.push("/bookings")}
              className="flex flex-col items-center gap-1 min-w-[52px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "history" ? "bg-emerald-500/20" : ""}`}
              >
                <History
                  size={22}
                  className={activeTab === "history" ? "text-emerald-400" : "text-white"}
                />
              </div>
              <span
                className={`text-xs ${activeTab === "history" ? "text-emerald-400 font-medium" : "text-white"}`}
              >
                {t?.bottomNav?.history ?? "История"}
              </span>
            </button>

            {/* Еще */}
            <button
              onClick={() => router.push("/profile")}
              className="flex flex-col items-center gap-1 min-w-[52px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "more" ? "bg-emerald-500/20" : ""}`}
              >
                <MoreHorizontal
                  size={22}
                  className={activeTab === "more" ? "text-emerald-400" : "text-white"}
                />
              </div>
              <span
                className={`text-xs ${activeTab === "more" ? "text-emerald-400 font-medium" : "text-white"}`}
              >
                {t?.bottomNav?.more ?? "Еще"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
