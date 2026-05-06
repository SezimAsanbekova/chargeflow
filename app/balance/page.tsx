'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, CreditCard, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

export default function BalancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(1000.00);
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'topup',
      amount: 500,
      date: '2024-01-15',
      description: 'Пополнение баланса'
    },
    {
      id: 2,
      type: 'charge',
      amount: -150,
      date: '2024-01-14',
      description: 'Зарядка на станции ChargePoint Bishkek'
    },
    {
      id: 3,
      type: 'topup',
      amount: 1000,
      date: '2024-01-10',
      description: 'Пополнение баланса'
    }
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
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
      {/* Header */}
      <div className="bg-emerald-500 px-4 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white text-2xl font-bold mb-2">Кошелек</h1>
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="text-white/80 text-sm mb-2">Текущий баланс</div>
            <div className="text-white text-4xl font-bold mb-4">{balance.toFixed(2)} сом</div>
            <button className="bg-white text-emerald-600 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition flex items-center gap-2">
              <Plus size={20} />
              Пополнить баланс
            </button>
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
            <button className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition">
              <History className="text-emerald-400 mb-3" size={24} />
              <div className="text-white font-medium text-sm">История операций</div>
              <div className="text-gray-400 text-xs mt-1">Все транзакции</div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-white text-xl font-bold mb-4">Последние операции</h2>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'topup' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.type === 'topup' ? (
                        <ArrowDownLeft className="text-emerald-400" size={20} />
                      ) : (
                        <ArrowUpRight className="text-red-400" size={20} />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{transaction.description}</div>
                      <div className="text-gray-400 text-xs">{transaction.date}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} сом
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}