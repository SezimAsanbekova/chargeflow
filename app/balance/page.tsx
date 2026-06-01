"use client";

import { useState, useEffect } from "react";
import "./printer-receipt.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getTranslations,
  getLocaleCookie,
  getIntlLocale,
  defaultLocale,
  type Locale,
} from "@/app/i18n";
import Image from "next/image";
import {
  Plus,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
  Hash,
  FileText,
  Mail,
} from "lucide-react";
import BottomNavigation from "@/app/components/BottomNavigation";

export default function BalancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [printerReady, setPrinterReady] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("5");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);

  const [transactions, setTransactions] = useState<
    Array<{
      id: string;
      type: string;
      amount: number;
      date: string;
      description: string;
      stationName?: string | null;
      status?: string;
    }>
  >([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Обработка возврата после оплаты Finik
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        const paymentId = sessionStorage.getItem('finik_payment_id');
        sessionStorage.removeItem('finik_payment_id');
        window.history.replaceState({}, '', '/balance');

        if (paymentId) {
          fetch('/api/finik/complete-redirect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.success) {
                setBalance(data.balance);
              } else {
                // Fallback — просто перезагружаем баланс
                fetch('/api/user/balance').then(r => r.json()).then(d => setBalance(d.balance || 0));
              }
            })
            .catch(() => {
              fetch('/api/user/balance').then(r => r.json()).then(d => setBalance(d.balance || 0));
            });
        } else {
          fetch('/api/user/balance').then(r => r.json()).then(d => setBalance(d.balance || 0));
        }
      }
    }
  }, []);

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "balance").then(setT);
  }, [locale]);

  useEffect(() => {
    if (showReceipt) {
      const timer = setTimeout(() => setPrinterReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setPrinterReady(false);
    }
  }, [showReceipt]);

  // Переводит описание транзакции по type + stationName
  const getTransactionDescription = (tx: {
    type: string;
    description: string;
    stationName?: string | null;
  }): string => {
    const types = t?.transactionTypes;
    if (!types) return tx.description; // пока переводы не загрузились
    switch (tx.type) {
      case "topup":
        return types.topup ?? tx.description;
      case "charge":
        if (tx.stationName) {
          return (types.charge ?? "{station}").replace(
            "{station}",
            tx.stationName,
          );
        }
        return types.chargeUnknown ?? tx.description;
      case "deposit":
        return types.deposit ?? tx.description;
      case "refund":
        return types.refund ?? tx.description;
      default:
        return types.default ?? tx.description;
    }
  };

  const downloadReceipt = async () => {
    const receiptElement = document.querySelector(".paper") as HTMLElement;
    if (!receiptElement) return;

    try {
      // Импортируем html2canvas динамически
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(receiptElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: receiptElement.scrollWidth,
        windowHeight: receiptElement.scrollHeight,
      });

      const link = document.createElement("a");
      link.download = `receipt-${selectedTransaction.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Ошибка при скачивании чека. Попробуйте сделать скриншот вручную.");
    }
  };

  useEffect(() => {
    const fetchBalanceAndTransactions = async () => {
      if (status === "authenticated") {
        try {
          // Загружаем баланс
          const balanceResponse = await fetch("/api/user/balance");
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            setBalance(balanceData.balance);
          }

          // Загружаем историю транзакций
          const transactionsResponse = await fetch("/api/user/transactions");
          if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData.transactions);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBalanceAndTransactions();
  }, [status]);

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

  return (
    <div className="min-h-screen bg-[#0a1f1a] pb-20">
      {/* Header - Glassmorphism Style */}
      <div className="relative px-4 pt-12 pb-8 overflow-hidden">
        <div className="max-w-2xl mx-auto relative z-10">
          {/* Glassmorphism Balance Card */}
          <div className="relative rounded-3xl p-4 bg-emerald-700/40 border border-emerald-600/30 shadow-2xl overflow-hidden">
            {/* Logo Pattern - Right Side */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-10">
              <Image
                src="/logo12.png"
                alt="ChargeFlow Logo"
                width={180}
                height={180}
                className="object-contain"
                style={{ width: "180px", height: "180px" }}
              />
            </div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-8">
                <h3 className="text-white text-lg font-bold tracking-wide">
                  ChargeFlow
                </h3>
              </div>

              <div
                className="text-white text-2xl font-bold mb-4 tracking-tight"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {Math.floor(balance)}{" "}
                <span className="text-xl font-medium text-white/90">сом</span>
              </div>

              {/* User Name */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                <span className="text-white/90 text-sm font-medium">
                  {session?.user?.name || "Пользователь"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-white text-xl font-bold mb-4">
            {t?.quickActions?.title ?? "Быстрые действия"}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-3 hover:border-emerald-500/50 transition flex items-center gap-3"
            >
              <History className="text-emerald-400" size={24} />
              <div className="text-left">
                <div className="text-white font-medium text-sm">
                  {t?.quickActions?.history?.title ?? "История операций"}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                  {t?.quickActions?.history?.subtitle ?? "Все транзакции"}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {showTransactions && (
        <div className="px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">
                {t?.transactions?.title ?? "Последние операции"}
              </h2>
              <button
                onClick={() => setShowTransactions(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            {transactions.length === 0 ? (
              <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-8 text-center">
                <History className="text-gray-500 mx-auto mb-3" size={48} />
                <div className="text-gray-400 text-sm">
                  {t?.transactions?.empty?.message ??
                    "История транзакций пуста"}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {t?.transactions?.empty?.hint ??
                    "Пополните баланс или совершите зарядку"}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowReceipt(true);
                    }}
                    className="w-full bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.amount > 0
                              ? "bg-emerald-500/20"
                              : "bg-red-500/20"
                          }`}
                        >
                          {transaction.amount > 0 ? (
                            <ArrowDownLeft
                              className="text-emerald-400"
                              size={20}
                            />
                          ) : (
                            <ArrowUpRight className="text-red-400" size={20} />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">
                            {getTransactionDescription(transaction)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(transaction.date).toLocaleString(
                              getIntlLocale(locale),
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-bold ${
                          transaction.amount > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount} сом
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Up Modal - Bottom Sheet */}
      {showTopUpModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-50 transition-opacity"
            onClick={() => setShowTopUpModal(false)}
          ></div>

          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="bg-[#0f2d26] rounded-t-3xl w-full p-6 shadow-2xl border-t border-emerald-900/30 max-h-[85vh] overflow-y-auto">
              {/* Handle Bar - Clickable */}
              <button
                onClick={() => setShowTopUpModal(false)}
                className="flex justify-center mb-4 w-full py-2 -mt-2"
              >
                <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {t?.topUp?.title ?? "Пополнить счет"}
                </h2>
              </div>

              {/* Amount Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[5, 100, 200, 300, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount(amount.toString());
                    }}
                    className={`py-5 rounded-2xl font-bold text-xl transition-all ${
                      selectedAmount === amount
                        ? "bg-emerald-500 text-white shadow-lg"
                        : "bg-[#0a1f1a] text-gray-300 hover:bg-emerald-500/20 border border-emerald-900/30"
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="mb-6">
                <div className="relative bg-[#0a1f1a] rounded-2xl border-2 border-emerald-900/30 focus-within:border-emerald-500 transition">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      const val = parseInt(e.target.value);
                      if ([100, 200, 300, 500, 1000, 2000].includes(val)) {
                        setSelectedAmount(val);
                      } else {
                        setSelectedAmount(0);
                      }
                    }}
                    placeholder={
                      t?.topUp?.customAmountPlaceholder ?? "Введите сумму"
                    }
                    className="w-full px-6 py-4 rounded-2xl text-xl font-medium text-emerald-400 placeholder:text-emerald-700 focus:outline-none bg-transparent"
                    min="100"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 text-base font-medium">
                    {t?.topUp?.currency ?? "KGZ"}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-3 ml-2">
                  {t?.topUp?.minAmountNote ??
                    "Минимальная сумма пополнения - 100 KGZ"}
                </p>
              </div>

              {/* Payment Error */}
              {paymentError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {paymentError}
                </div>
              )}

              {/* Top Up Button */}
              <button
                onClick={async () => {
                  const amount = customAmount ? parseInt(customAmount) : selectedAmount;
                  if (!amount || amount < 1) {
                    setPaymentError("Укажите сумму пополнения");
                    return;
                  }
                  setIsProcessingPayment(true);
                  setPaymentError("");
                  try {
                    const res = await fetch('/api/finik/create-payment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.details || data.error || 'Ошибка');
                    if (data.paymentUrl) {
                      sessionStorage.setItem('finik_payment_id', data.paymentId);
                      window.location.href = data.paymentUrl;
                    }
                  } catch (err) {
                    setPaymentError(err instanceof Error ? err.message : 'Ошибка создания платежа');
                    setIsProcessingPayment(false);
                  }
                }}
                disabled={isProcessingPayment}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold text-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Перенаправление...
                  </>
                ) : (
                  t?.topUp?.topUpButton ?? "Пополнить"
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Receipt Modal - Printer Style */}
      {showReceipt && selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md receipt-modal-enter">

            {/* Printer */}
            <div className="printer-container">
              <div
                className={`printer${printerReady ? ' show-receipt' : ''}`}
                id="receipt-content"
              >
                <span className="printer-name">ChargeFlow</span>
                <div className="signal"></div>
                <div className="mouth">
                  <div className="paper">
                    {/* Receipt Title */}
                    <div className="receipt-title">ChargeFlow</div>
                    <div className="receipt-subtitle">
                      {t?.receipt?.systemName ?? "Система зарядных станций"}
                    </div>
                    <div className="receipt-date">
                      {new Date(selectedTransaction.date).toLocaleString(
                        getIntlLocale(locale),
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>

                    <hr className="receipt-divider" />

                    {/* Details */}
                    <div className="payment-section">
                      <div className="receipt-row">
                        <span className="label">#{" "}</span>
                        <span className="value">
                          {selectedTransaction.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="receipt-row">
                        <span className="label">
                          {t?.receipt?.operationType ?? "Операция:"}
                        </span>
                        <span className="value">
                          {getTransactionDescription(selectedTransaction)}
                        </span>
                      </div>
                      <div className="receipt-row">
                        <span className="label">
                          {t?.receipt?.status ?? "Статус:"}
                        </span>
                        <span className="value">
                          {selectedTransaction.status === "success"
                            ? `✓ ${t?.receipt?.statusSuccess ?? "Успешно"}`
                            : (t?.receipt?.statusProcessing ?? "Обработка")}
                        </span>
                      </div>
                    </div>

                    <hr className="receipt-divider" />

                    {/* Total */}
                    <div className={`receipt-total ${selectedTransaction.amount > 0 ? 'positive' : 'negative'}`}>
                      {selectedTransaction.amount > 0 ? "+" : ""}
                      {Math.abs(selectedTransaction.amount).toFixed(2)}{" "}
                      {t?.topUp?.currency ?? "сом"}
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
            <div className="mt-8 space-y-3 px-4">
              <button
                onClick={downloadReceipt}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2 text-base"
              >
                <ArrowDownLeft size={20} />
                {t?.receipt?.downloadButton ?? "Скачать чек (PNG)"}
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setSelectedTransaction(null);
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-semibold transition text-base"
              >
                {t?.receipt?.closeButton ?? "Закрыть"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showReceipt && !showTopUpModal && (
        <>
          <BottomNavigation />

          {/* Floating Top Up Button */}
          <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setShowTopUpModal(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg transform hover:scale-105"
              >
                <Plus size={24} strokeWidth={3} />
                {t?.topUpButton ?? "Пополнить баланс"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
