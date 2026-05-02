'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Zap, DollarSign, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  totalSessions: number;
  totalEnergy: number;
  totalRevenue: number;
  totalUsers: number;
  totalUsersCount: number;
  totalStationsCount: number;
  averageSessionTime: number;
  sessionsPerDay: Array<{ date: string; count: number }>;
  period: string;
  startDate: string;
  endDate: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (period === 'custom' && customDate) {
        params.append('date', customDate);
      }
      
      const response = await fetch(`/api/admin/analytics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = () => {
    if (customDate) {
      fetchAnalytics();
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    
    // Create printable content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Отчет - ${getPeriodText()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #10b981; text-align: center; }
          h2 { color: #333; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #10b981; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
          .stat-label { color: #666; margin-top: 5px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>ChargeFlow - Отчет по аналитике</h1>
        <p style="text-align: center; color: #666;">${getPeriodText()}</p>
        <p style="text-align: center; color: #666;">Дата создания: ${new Date().toLocaleString('ru-RU')}</p>

        <h2>Основная статистика</h2>
        <table>
          <tr>
            <th>Показатель</th>
            <th>Значение</th>
          </tr>
          <tr>
            <td>Всего сессий за период</td>
            <td>${data.totalSessions}</td>
          </tr>
          <tr>
            <td>Энергия потреблена</td>
            <td>${data.totalEnergy.toFixed(2)} кВт⋅ч</td>
          </tr>
          <tr>
            <td>Доход за период</td>
            <td>${data.totalRevenue.toFixed(2)} сом</td>
          </tr>
          <tr>
            <td>Активных пользователей за период</td>
            <td>${data.totalUsers}</td>
          </tr>
          <tr>
            <td>Среднее время сессии</td>
            <td>${data.averageSessionTime} минут</td>
          </tr>
          <tr>
            <td>Средний доход за сессию</td>
            <td>${data.totalSessions ? (data.totalRevenue / data.totalSessions).toFixed(2) : 0} сом</td>
          </tr>
        </table>

        <h2>Общая информация о системе</h2>
        <table>
          <tr>
            <th>Показатель</th>
            <th>Значение</th>
          </tr>
          <tr>
            <td>Всего пользователей в системе</td>
            <td>${data.totalUsersCount}</td>
          </tr>
          <tr>
            <td>Всего станций</td>
            <td>${data.totalStationsCount}</td>
          </tr>
        </table>

        <div class="footer">
          <p>ChargeFlow Admin Panel - Система управления зарядными станциями</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getPeriodText = () => {
    switch (period) {
      case 'day':
        return 'За сегодня';
      case 'week':
        return 'За неделю';
      case 'month':
        return 'За месяц';
      case 'year':
        return 'За год';
      case 'all':
        return 'За все время';
      case 'custom':
        return customDate ? `За ${customDate}` : 'Выберите дату';
      default:
        return '';
    }
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
          <h1 className="text-3xl font-bold text-white mb-2">Аналитика</h1>
          <p className="text-gray-400">Статистика и отчеты по использованию</p>
        </div>

        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleExportPDF}
            disabled={!data}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Скачать отчет (PDF)
          </button>
        </div>

        {/* Period Filters */}
        <div className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">Отчёты</h2>
          <div className="flex flex-wrap gap-3 mb-4">
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
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-lg transition ${
                period === 'custom'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#0f2d26] border border-emerald-500/30 text-gray-400 hover:text-white hover:border-emerald-500'
              }`}
            >
              Кастом
            </button>
          </div>

          {/* Custom Date Picker */}
          {period === 'custom' && (
            <div className="flex gap-3 items-center">
              <label className="text-gray-300">Выберите дату:</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-[#0f2d26] border border-emerald-500/30 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleCustomDateSubmit}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Показать
              </button>
            </div>
          )}
        </div>

        {/* Period Title */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white">{getPeriodText()}</h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Zap className="text-emerald-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Всего сессий</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.totalSessions || 0}
            </div>
          </div>

          {/* Total Energy */}
          <div className="bg-[#0f2d26] border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-yellow-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Энергия</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.totalEnergy.toFixed(2) || 0} кВт⋅ч
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-[#0f2d26] border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Доход</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.totalRevenue.toFixed(2) || 0} сом
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-[#0f2d26] border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-blue-500" size={24} />
              </div>
              <span className="text-gray-400 text-sm">Пользователей</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.totalUsers || 0}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-white text-lg font-semibold mb-4">
            Дополнительная статистика
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-[#0a1f1a] rounded-lg">
              <span className="text-gray-400">Среднее время сессии</span>
              <span className="text-white font-semibold">
                {data?.averageSessionTime || 0} мин
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0a1f1a] rounded-lg">
              <span className="text-gray-400">Средний доход за сессию</span>
              <span className="text-white font-semibold">
                {data?.totalSessions
                  ? (data.totalRevenue / data.totalSessions).toFixed(2)
                  : 0}{' '}
                сом
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0a1f1a] rounded-lg">
              <span className="text-gray-400">Всего пользователей в системе</span>
              <span className="text-white font-semibold">
                {data?.totalUsersCount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0a1f1a] rounded-lg">
              <span className="text-gray-400">Всего станций</span>
              <span className="text-white font-semibold">
                {data?.totalStationsCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            График активности
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            График будет добавлен в следующей версии
          </div>
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
