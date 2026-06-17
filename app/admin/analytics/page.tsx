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
  dailyRevenue: Array<{ date: string; total: number }>;
  connectorStats: Array<{ type: string; count: number }>;
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
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
          .stat-card { border: 2px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #10b981; margin: 10px 0; }
          .stat-label { color: #666; font-size: 14px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>ChargeFlow - Отчет по аналитике</h1>
        <p style="text-align: center; color: #666;">${getPeriodText()}</p>
        <p style="text-align: center; color: #666;">Дата создания: ${new Date().toLocaleString('ru-RU')}</p>

        <h2>Основные показатели</h2>
        <table>
          <tr>
            <th>Показатель</th>
            <th>Значение</th>
          </tr>
          <tr>
            <td>⚡ Всего энергии</td>
            <td>${Math.round(data.totalEnergy)} кВт·ч</td>
          </tr>
          <tr>
            <td>💰 Общий доход</td>
            <td>${Math.round(data.totalRevenue).toLocaleString()} сом</td>
          </tr>
          <tr>
            <td>🔌 Всего зарядок</td>
            <td>${data.totalSessions} сессий</td>
          </tr>
        </table>

        <h2>Доход по дням (последние 7 дней)</h2>
        <table>
          <tr>
            <th>Дата</th>
            <th>Доход</th>
          </tr>
          ${data.dailyRevenue && data.dailyRevenue.length > 0 
            ? data.dailyRevenue.slice().reverse().map(day => {
                const date = new Date(day.date);
                const dateStr = date.toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                });
                return `
                  <tr>
                    <td>${dateStr}</td>
                    <td>${Math.round(day.total).toLocaleString()} сом</td>
                  </tr>
                `;
              }).join('')
            : '<tr><td colspan="2">Нет данных</td></tr>'
          }
        </table>

        <h2>Популярность коннекторов</h2>
        <table>
          <tr>
            <th>Тип коннектора</th>
            <th>Количество</th>
            <th>Процент</th>
          </tr>
          ${data.connectorStats && data.connectorStats.length > 0
            ? data.connectorStats.map(connector => {
                const totalCount = data.connectorStats.reduce((sum, c) => sum + c.count, 0);
                const percentage = ((connector.count / totalCount) * 100).toFixed(1);
                return `
                  <tr>
                    <td>${connector.type}</td>
                    <td>${connector.count}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')
            : '<tr><td colspan="3">Нет данных</td></tr>'
          }
        </table>

        <div class="footer">
          <p>ChargeFlow Admin Panel - Система управления зарядными станциями</p>
          <p>Отчет сформирован автоматически</p>
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

        {/* Stats Grid - 3 карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Energy */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Zap className="text-emerald-500" size={24} />
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-white">
                  {Math.round(data?.totalEnergy || 0)} кВт·ч
                </div>
                <span className="text-gray-400 text-sm">Всего энергии</span>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-[#0f2d26] border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-amber-500" size={24} />
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-white">
                  {Math.round(data?.totalRevenue || 0).toLocaleString()} сом
                </div>
                <span className="text-gray-400 text-sm">Общая выручка</span>
              </div>
            </div>
          </div>

          {/* Total Sessions */}
          <div className="bg-[#0f2d26] border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Zap className="text-purple-500" size={24} />
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-white">
                  {data?.totalSessions || 0} сессий
                </div>
                <span className="text-gray-400 text-sm">Всего зарядок</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Revenue Chart - Vertical Bar Chart */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 size={20} />
              Доход по дням (последние 7 дней)
            </h3>
            {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
              <div className="flex items-end justify-around h-64 gap-2">
                {data.dailyRevenue.slice().reverse().map((day, index) => {
                  const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.total), 1);
                  const heightPercentage = (day.total / maxRevenue) * 100;
                  const date = new Date(day.date);
                  const dateStr = date.toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short' 
                  });
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 gap-2">
                      <div className="text-emerald-400 text-xs font-semibold text-center">
                        {Math.round(day.total).toLocaleString()}
                      </div>
                      <div className="w-full relative" style={{ height: '200px' }}>
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-emerald-400 hover:to-emerald-300"
                          style={{ height: `${heightPercentage}%` }}
                        />
                      </div>
                      <div className="text-gray-400 text-xs text-center">{dateStr}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-16">
                Нет данных за последние 7 дней
              </div>
            )}
          </div>

          {/* Connector Usage Chart - Pie Chart */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp size={20} />
              Популярность коннекторов
            </h3>
            {data?.connectorStats && data.connectorStats.length > 0 ? (
              <div className="flex items-center gap-8">
                {/* Pie Chart */}
                <div className="relative w-48 h-48 flex-shrink-0">
                  <svg viewBox="0 0 200 200" className="transform -rotate-90">
                    {data.connectorStats.map((connector, index) => {
                      const totalCount = data.connectorStats.reduce((sum, c) => sum + c.count, 0);
                      const percentage = (connector.count / totalCount) * 100;
                      const angle = (percentage / 100) * 360;
                      
                      // Вычисляем начальный угол (сумма всех предыдущих)
                      let startAngle = 0;
                      for (let i = 0; i < index; i++) {
                        startAngle += (data.connectorStats[i].count / totalCount) * 360;
                      }
                      
                      // Конвертируем углы в радианы
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = ((startAngle + angle) * Math.PI) / 180;
                      
                      // Вычисляем координаты дуги
                      const x1 = 100 + 80 * Math.cos(startRad);
                      const y1 = 100 + 80 * Math.sin(startRad);
                      const x2 = 100 + 80 * Math.cos(endRad);
                      const y2 = 100 + 80 * Math.sin(endRad);
                      
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      const pathData = [
                        `M 100 100`,
                        `L ${x1} ${y1}`,
                        `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
                        `Z`
                      ].join(' ');
                      
                      const colors = [
                        'rgb(16, 185, 129)',  // emerald-500
                        'rgb(59, 130, 246)',   // blue-500
                        'rgb(168, 85, 247)',   // purple-500
                        'rgb(251, 146, 60)',   // orange-500
                      ];
                      
                      return (
                        <path
                          key={index}
                          d={pathData}
                          fill={colors[index % colors.length]}
                          opacity="0.9"
                          className="transition-opacity hover:opacity-100"
                        />
                      );
                    })}
                    {/* Центральный круг */}
                    <circle cx="100" cy="100" r="50" fill="#0a1f1a" />
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {data.connectorStats.map((connector, index) => {
                    const totalCount = data.connectorStats.reduce((sum, c) => sum + c.count, 0);
                    const percentage = ((connector.count / totalCount) * 100).toFixed(1);
                    const colors = [
                      'rgb(16, 185, 129)',
                      'rgb(59, 130, 246)',
                      'rgb(168, 85, 247)',
                      'rgb(251, 146, 60)',
                    ];
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">{connector.type}</span>
                            <span className="text-white font-semibold text-sm">
                              {connector.count} ({percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-16">
                Нет данных о коннекторах
              </div>
            )}
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
