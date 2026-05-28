"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Wallet, History, MoreHorizontal } from "lucide-react";
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
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "map" ? "bg-emerald-500/20" : ""}`}
              >
                <Home
                  size={24}
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
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "balance" ? "bg-emerald-500/20" : ""}`}
              >
                <Wallet
                  size={24}
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
              className="flex flex-col items-center gap-1"
            >
              <div className="relative">
                {/* Spinning gradient orb */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  transform: activeTab === "ai" ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: activeTab === "ai" ? '0 0 12px rgba(16,185,129,0.5)' : 'none',
                }}>
                  {/* Градиент 1 — медленный */}
                  <div style={{
                    position: 'absolute', width: 38, height: 38, borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, rgba(16,185,129,1), rgba(6,182,212,0.6), rgba(255,255,255,0.9), rgba(20,184,166,0.8), rgba(16,185,129,1))',
                    filter: 'blur(10px)',
                    animation: 'ai-spin 8s linear infinite',
                    transformOrigin: 'center',
                  }} />
                  {/* Градиент 2 — быстрый */}
                  <div style={{
                    position: 'absolute', width: 38, height: 38, borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, rgba(6,182,212,0.8), rgba(16,185,129,0.4), rgba(6,182,212,0.8))',
                    filter: 'blur(10px)',
                    animation: 'ai-spin 4s linear infinite reverse',
                    transformOrigin: 'center',
                    opacity: 0.5,
                  }} />
                  {/* Sparkle звезда по центру */}
                  <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 119 119" fill="none">
                      <path d="M90.425 14.7269C89.6134 13.038 87.9055 11.9639 86.0317 11.9639C84.1579 11.9639 82.45 13.038 81.6384 14.7269C81.3075 15.4155 81.0112 15.9429 80.7294 16.3264C80.5485 16.5727 80.4367 16.6721 80.4092 16.6957C78.8274 17.5438 77.8383 19.1938 77.8383 20.9914C77.8383 22.7889 78.8274 24.439 80.4092 25.287C80.4367 25.3107 80.5485 25.4101 80.7294 25.6564C81.0112 26.0399 81.3075 26.5673 81.6384 27.2558C82.45 28.9447 84.1579 30.0189 86.0317 30.0189C87.9055 30.0189 89.6134 28.9447 90.425 27.2558C90.7558 26.5673 91.0522 26.0399 91.3339 25.6564C91.5149 25.4101 91.6267 25.3107 91.6542 25.287C93.2359 24.439 94.225 22.7889 94.225 20.9914C94.225 19.1938 93.2359 17.5438 91.6542 16.6957C91.6267 16.672 91.5149 16.5727 91.3339 16.3264C91.0522 15.9429 90.7558 15.4155 90.425 14.7269Z" fill="white"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M63.9231 27.9225C63.125 26.1999 61.3992 25.0974 59.5006 25.0974C57.602 25.0974 55.8762 26.1999 55.078 27.9225C53.8458 30.582 52.963 34.0177 52.1915 37.0202C51.96 37.9211 51.7385 38.7832 51.5206 39.5734C50.4432 43.4812 49.3104 46.4247 47.6397 48.3426C46.1886 50.0083 43.1591 51.4202 38.6345 52.8731C37.5778 53.2124 36.5058 53.5359 35.4111 53.8648L35.1955 53.9296C34.1837 54.2334 33.1468 54.5449 32.1488 54.862C30.0638 55.5245 27.8293 56.3077 25.9474 57.3275C24.375 58.1796 23.3955 59.8245 23.3955 61.6129C23.3955 63.4014 24.375 65.0462 25.9474 65.8984C27.8186 66.9124 30.0441 67.702 32.1232 68.3752C33.2437 68.7381 34.1973 69.0307 35.1326 69.3177C36.2313 69.6548 37.3048 69.9842 38.5941 70.4106C43.1012 71.9013 46.1432 73.3585 47.6082 75.0742C49.2998 77.0553 50.4387 80.0701 51.517 84.0237C51.7326 84.8142 51.9515 85.6735 52.1798 86.5703C52.954 89.611 53.838 93.0826 55.078 95.7589C55.8762 97.4815 57.602 98.5839 59.5006 98.5839C61.3991 98.5839 63.125 97.4815 63.9231 95.7589C65.1631 93.0826 66.047 89.6114 66.8212 86.5707C67.0496 85.6738 67.2685 84.8143 67.4841 84.0237C68.5625 80.0701 69.7014 77.0553 71.3929 75.0742C72.8579 73.3585 75.9 71.9013 80.4071 70.4106C81.6961 69.9843 82.7694 69.655 83.8678 69.3179L83.8696 69.3174C84.8046 69.0304 85.7579 68.7379 86.8779 68.3752C88.9571 67.702 91.1826 66.9124 93.0537 65.8984C94.6262 65.0462 95.6056 63.4014 95.6056 61.6129C95.6056 59.8245 94.6262 58.1796 93.0537 57.3275C91.1719 56.3077 88.9373 55.5245 86.8524 54.862C85.8545 54.5449 84.8178 54.2335 83.8061 53.9297L83.5901 53.8648C82.4954 53.5359 81.4233 53.2124 80.3667 52.8731C75.842 51.4202 72.8125 50.0083 71.3615 48.3426C69.6908 46.4247 68.558 43.4812 67.4806 39.5734C67.2627 38.7832 67.0412 37.9213 66.8097 37.0203C66.0382 34.0178 65.1554 30.582 63.9231 27.9225ZM54.9902 54.7458C57.0759 52.3515 58.4754 49.4844 59.5006 46.6842C60.5258 49.4844 61.9252 52.3515 64.0109 54.7458C67.0763 58.2648 71.8233 60.2772 75.8729 61.6556C71.8034 63.0805 67.0438 65.1552 63.9794 68.744C61.9119 71.1654 60.5214 74.0542 59.5006 76.8755C58.4798 74.0542 57.0893 71.1654 55.0217 68.744C51.9573 65.1552 47.1977 63.0805 43.1282 61.6556C47.1778 60.2772 51.9248 58.2648 54.9902 54.7458Z" fill="white"/>
                    </svg>
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold ${
                activeTab === "ai" ? "text-emerald-300" : "text-emerald-400"
              }`}>AI</span>
            </button>

            {/* История */}
            <button
              onClick={() => router.push("/bookings")}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "history" ? "bg-emerald-500/20" : ""}`}
              >
                <History
                  size={24}
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
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div
                className={`p-2 rounded-lg transition ${activeTab === "more" ? "bg-emerald-500/20" : ""}`}
              >
                <MoreHorizontal
                  size={24}
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
