'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, CreditCard, History, ArrowUpRight, ArrowDownLeft, X, Check, Hash, FileText, Mail } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

export default function BalancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
    status?: string;
  }>>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const downloadReceipt = async () => {
    const receiptElement = document.getElementById('receipt-content');
    if (!receiptElement) return;

    try {
      // Импортируем html2canvas динамически
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(receiptElement, {
        backgroundColor: '#10b981',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: receiptElement.scrollWidth,
        windowHeight: receiptElement.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `receipt-${selectedTransaction.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Ошибка при скачивании чека. Попробуйте сделать скриншот вручную.');
    }
  };

  useEffect(() => {
    const fetchBalanceAndTransactions = async () => {
      if (status === 'authenticated') {
        try {
          // Загружаем баланс
          const balanceResponse = await fetch('/api/user/balance');
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            setBalance(balanceData.balance);
          }

          // Загружаем историю транзакций
          const transactionsResponse = await fetch('/api/user/transactions');
          if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData.transactions);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBalanceAndTransactions();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
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
                style={{ width: '180px', height: '180px' }}
              />
            </div>
            
            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-8">
                <h3 className="text-white text-lg font-bold tracking-wide">ChargeFlow</h3>
              </div>
              
              <div className="text-white text-2xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {Math.floor(balance)} <span className="text-xl font-medium text-white/90">сом</span>
              </div>
              
              {/* User Name */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                <span className="text-white/90 text-sm font-medium">
                  {session?.user?.name || 'Пользователь'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-white text-xl font-bold mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition">
              <CreditCard className="text-emerald-400 mb-3" size={24} />
              <div className="text-white font-medium text-sm">Добавить карту</div>
              <div className="text-gray-400 text-xs mt-1">Для автопополнения</div>
            </button>
            <button 
              onClick={() => setShowTransactions(!showTransactions)}
              className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
            >
              <History className="text-emerald-400 mb-3" size={24} />
              <div className="text-white font-medium text-sm">История операций</div>
              <div className="text-gray-400 text-xs mt-1">Все транзакции</div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {showTransactions && (
        <div className="px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Последние операции</h2>
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
                <div className="text-gray-400 text-sm">История транзакций пуста</div>
                <div className="text-gray-500 text-xs mt-1">Пополните баланс или совершите зарядку</div>
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.amount > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          {transaction.amount > 0 ? (
                            <ArrowDownLeft className="text-emerald-400" size={20} />
                          ) : (
                            <ArrowUpRight className="text-red-400" size={20} />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{transaction.description}</div>
                          <div className="text-gray-400 text-xs">
                            {new Date(transaction.date).toLocaleString('ru-RU', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} сом
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
                <h2 className="text-2xl font-bold text-white">Пополнить счет</h2>
              </div>

              {/* Amount Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[100, 200, 300, 500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount(amount.toString());
                    }}
                    className={`py-5 rounded-2xl font-bold text-xl transition-all ${
                      selectedAmount === amount
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-[#0a1f1a] text-gray-300 hover:bg-emerald-500/20 border border-emerald-900/30'
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
                    placeholder="Введите сумму"
                    className="w-full px-6 py-4 rounded-2xl text-xl font-medium text-emerald-400 placeholder:text-emerald-700 focus:outline-none bg-transparent"
                    min="100"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 text-base font-medium">
                    KGZ
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-3 ml-2">
                  Минимальная сумма пополнения - 100 KGZ
                </p>
              </div>

              {/* Top Up Button */}
              <button
                onClick={() => {
                  const amount = customAmount ? parseInt(customAmount) : selectedAmount;
                  if (amount >= 100) {
                    // Здесь будет логика пополнения
                    alert(`Пополнение на ${amount} сом`);
                    setShowTopUpModal(false);
                  } else {
                    alert('Минимальная сумма пополнения - 100 сом');
                  }
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-bold text-xl transition-all shadow-lg hover:shadow-xl"
              >
                Пополнить
              </button>
            </div>
          </div>
        </>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedTransaction && (
        <div className="fixed inset-0 bg-[#0f2d26] z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Receipt Content */}
            <div id="receipt-content" className="rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: '#10b981', color: '#ffffff' }}>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>ChargeFlow</div>
                <div className="text-base mb-3" style={{ color: '#e0f2e9' }}>Система зарядных станций</div>
                <div className="text-sm" style={{ color: '#d1f4e0' }}>
                  {new Date(selectedTransaction.date).toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="my-6" style={{ borderTop: '2px dashed rgba(255, 255, 255, 0.3)' }}></div>

              {/* Transaction Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base flex items-center gap-2" style={{ color: '#e0f2e9' }}>
                    <Hash size={16} />
                    Номер операции:
                  </span>
                  <span className="text-base font-semibold" style={{ color: '#ffffff' }}>{selectedTransaction.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base flex items-center gap-2" style={{ color: '#e0f2e9' }}>
                    <FileText size={16} />
                    Тип операции:
                  </span>
                  <span className="text-base font-medium text-right" style={{ color: '#ffffff', maxWidth: '60%' }}>{selectedTransaction.description}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base flex items-center gap-2" style={{ color: '#e0f2e9' }}>
                    <Check size={16} />
                    Статус:
                  </span>
                  <span className="text-base font-medium flex items-center gap-1" style={{ color: '#ffffff' }}>
                    {selectedTransaction.status === 'success' ? (
                      <>
                        <Check size={18} />
                        Успешно
                      </>
                    ) : (
                      'Обработка'
                    )}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-6" style={{ borderTop: '2px dashed rgba(255, 255, 255, 0.3)' }}></div>

              {/* Amount */}
              <div className="text-center py-6">
                <div className="text-lg mb-2" style={{ color: '#e0f2e9' }}>Сумма:</div>
                <div className="text-4xl font-bold" style={{ 
                  color: selectedTransaction.amount > 0 ? '#ffffff' : '#fef3c7'
                }}>
                  {selectedTransaction.amount > 0 ? '+' : ''}{Math.abs(selectedTransaction.amount).toFixed(2)} сом
                </div>
              </div>

              {/* Divider */}
              <div className="my-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}></div>

              {/* Footer */}
              <div className="text-center space-y-2" style={{ color: '#d1f4e0' }}>
                <div className="text-sm">Спасибо за использование ChargeFlow!</div>
                <div className="text-sm flex items-center justify-center gap-2">
                  <Mail size={14} />
                  support@chargeflow.kg
                </div>
                <div className="text-xs mt-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Этот чек является подтверждением операции
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-3">
              <button
                onClick={downloadReceipt}
                className="w-full bg-[#065f46] hover:bg-[#047857] text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-2 text-base"
              >
                <ArrowDownLeft size={20} />
                Скачать чек (PNG)
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setSelectedTransaction(null);
                }}
                className="w-full bg-[#1f2937] hover:bg-[#374151] text-white py-4 rounded-2xl font-semibold transition text-base"
              >
                Закрыть
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
                Пополнить баланс
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}