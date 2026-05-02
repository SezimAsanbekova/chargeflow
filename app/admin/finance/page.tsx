'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Wallet, Download } from 'lucide-react';
import Link from 'next/link';

interface Payment {
  id: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    phone: string | null;
  };
}

interface FinanceData {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averagePayment: number;
  payments: Payment[];
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceData | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('all');

  useEffect(() => {
    fetchFinance();
  }, [period]);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      const response = await fetch(`/api/admin/finance?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching finance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'charge':
        return 'Зарядка';
      case 'deposit':
        return 'Депозит';
      case 'refund':
        return 'Возврат';
      case 'topup':
        return 'Пополнение';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Успешно';
      case 'pending':
        return 'В обработке';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredPayments = data?.payments.filter((payment) => {
    if (filter === 'all') return true;
    return payment.status === filter;
  }) || [];

  const handleExportCSV = () => {
    if (!data) return;

    const csv = [
      ['Дата', 'Пользователь', 'Тип', 'Метод', 'Сумма', 'Статус'].join(','),
      ...filteredPayments.map((p) =>
        [
          formatDate(p.createdAt),
          p.user.phone || p.user.email,
          getPaymentTypeText(p.type),
          p.method,
          p.amount,
          getStatusText(p.status),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Финансы</h1>
          <p className="text-gray-400">Доходы, платежи и транзакции</p>
        </div>

        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
          >
            <Download size={20} />
            Экспорт CSV
          </button>
        </div>

        {/* Period Filters */}
        <div className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">Период</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPeriod('all')}
              className={`px-4 py-2 rounded-lg transition ${
                period === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              Все время
            </button>
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-lg transition ${
                period === 'day'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              День
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg transition ${
                period === 'week'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg transition ${
                period === 'month'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg transition ${
                period === 'year'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              Год
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-[#0f2d26] border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Общий доход</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.totalRevenue.toFixed(2) || 0} сом
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-[#0f2d26] border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CreditCard className="text-blue-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Всего платежей</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.totalPayments || 0}
            </div>
          </div>

          {/* Successful Payments */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-emerald-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Успешных</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.successfulPayments || 0}
            </div>
          </div>

          {/* Average Payment */}
          <div className="bg-[#0f2d26] border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Wallet className="text-purple-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Средний платеж</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.averagePayment.toFixed(2) || 0} сом
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0f2d26] border border-yellow-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {data?.pendingPayments || 0}
            </div>
            <div className="text-gray-400 text-sm">В обработке</div>
          </div>
          <div className="bg-[#0f2d26] border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {data?.failedPayments || 0}
            </div>
            <div className="text-gray-400 text-sm">Ошибок</div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">Фильтр по статусу</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] text-gray-400 hover:text-white'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'success'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] text-gray-400 hover:text-white'
              }`}
            >
              Успешные
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'pending'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] text-gray-400 hover:text-white'
              }`}
            >
              В обработке
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'failed'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] text-gray-400 hover:text-white'
              }`}
            >
              Ошибки
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-emerald-900/30">
            <h2 className="text-xl font-semibold text-white">История платежей</h2>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Нет платежей</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a1f1a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Метод
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/30">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[#0a1f1a] transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {payment.user.phone || payment.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {getPaymentTypeText(payment.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {payment.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-400">
                        {payment.amount.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href="/admin/dashboard"
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Назад к панели
          </Link>
        </div>
      </div>
    </div>
  );
}
