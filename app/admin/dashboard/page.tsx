'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  MapPin, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  Activity,
  DollarSign,
  Zap,
  CheckCircle2,
  TrendingUp,
  Server,
  CreditCard,
  Map
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface ActivityItem {
  type: string;
  id: string;
  timestamp: Date;
  status: string;
  user_name: string | null;
  station_name: string | null;
  start_time?: Date;
  end_time?: Date;
}

interface DailyData {
  date: string;
  count: number;
}

interface DashboardStats {
  totalUsers: number;
  totalStations: number;
  activeSessions: number;
  availableConnectors: number;
  recentActivity: ActivityItem[];
  dailyData: DailyData[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Получаем данные администратора
      const userResponse = await fetch('/api/admin/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Получаем статистику
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/signin');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatActivityMessage = (activity: ActivityItem): string => {
    const userName = activity.user_name || 'Пользователь';
    
    switch (activity.type) {
      case 'session':
        if (activity.status === 'active') {
          return `${userName} начал зарядку на ${activity.station_name}`;
        } else if (activity.status === 'completed') {
          return `${userName} завершил зарядку на ${activity.station_name}`;
        }
        return `${userName} - зарядка на ${activity.station_name}`;
      
      case 'booking':
        if (activity.status === 'active') {
          return `${userName} забронировал станцию ${activity.station_name}`;
        } else if (activity.status === 'cancelled') {
          return `${userName} отменил бронь — потерян депозит`;
        }
        return `${userName} - бронь на ${activity.station_name}`;
      
      case 'user':
        return `Зарегистрировался новый пользователь ${userName}`;
      
      default:
        return `Активность: ${userName}`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Zap size={20} className="text-purple-400" />;
      case 'booking':
        return <Calendar size={20} className="text-amber-400" />;
      case 'user':
        return <Users size={20} className="text-emerald-400" />;
      default:
        return <Activity size={20} className="text-gray-400" />;
    }
  };

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return new Date(timestamp).toLocaleString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getWeeklyChartData = () => {
    if (!stats?.dailyData) return [];
    
    // Группируем по неделям (последние 4 недели)
    const weeks = [
      { label: 'Неделя 1 (1-7 дней назад)', start: 0, end: 7 },
      { label: 'Неделя 2 (8-14 дней назад)', start: 7, end: 14 },
      { label: 'Неделя 3 (15-21 день назад)', start: 14, end: 21 },
      { label: 'Неделя 4 (22-30 дней назад)', start: 21, end: 30 },
    ];

    return weeks.map(week => {
      let count = 0;
      const startIndex = stats.dailyData.length - week.end;
      const endIndex = stats.dailyData.length - week.start;
      
      for (let i = startIndex; i < endIndex && i >= 0; i++) {
        if (stats.dailyData[i]) {
          count += stats.dailyData[i].count;
        }
      }
      
      return { ...week, count };
    }); // Убрали .reverse() - теперь порядок правильный
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a1f1a]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  const chartData = getWeeklyChartData();
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const totalCount = chartData.reduce((sum, d) => sum + d.count, 0);
  
  // Цвета для круговой диаграммы
  const colors = [
    'rgb(16, 185, 129)', // emerald-500
    'rgb(59, 130, 246)', // blue-500
    'rgb(168, 85, 247)', // purple-500
    'rgb(251, 146, 60)', // orange-500
  ];

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Привет, {user?.name || 'Администратор'} 👋
        </h1>
      </div>

      {/* Stats Grid - 3 карточки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Users className="text-emerald-400" size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1 flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            Пользователей
          </h3>
          <p className="text-white text-3xl font-bold">
            {stats?.totalUsers || 0}
          </p>
        </div>

        {/* Total Stations */}
        <div className="bg-[#0f2d26] border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MapPin className="text-blue-400" size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1 flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" />
            Станций
          </h3>
          <p className="text-white text-3xl font-bold">
            {stats?.totalStations || 0}
          </p>
        </div>

        {/* Active Sessions */}
        <div className="bg-[#0f2d26] border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Zap className="text-purple-400" size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1 flex items-center gap-2">
            <Zap size={16} className="text-purple-400" />
            Зарядка сейчас
          </h3>
          <p className="text-white text-3xl font-bold">
            {stats?.activeSessions || 0}
          </p>
        </div>
      </div>

      {/* Circular Chart */}
      <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="text-emerald-400" size={24} />
          <h3 className="text-white text-xl font-semibold">
            Зарядки за последние 30 дней
          </h3>
        </div>
        {chartData.length > 0 && totalCount > 0 ? (
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Круговая диаграмма */}
            <div className="relative w-64 h-64 flex-shrink-0">
              <svg viewBox="0 0 200 200" className="transform -rotate-90">
                {chartData.map((week, index) => {
                  const percentage = (week.count / totalCount) * 100;
                  const angle = (percentage / 100) * 360;
                  
                  // Вычисляем начальный угол (сумма всех предыдущих)
                  let startAngle = 0;
                  for (let i = 0; i < index; i++) {
                    startAngle += (chartData[i].count / totalCount) * 360;
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
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={colors[index]}
                      opacity="0.9"
                      className="transition-opacity hover:opacity-100"
                    />
                  );
                })}
                {/* Центральный круг */}
                <circle cx="100" cy="100" r="50" fill="#0a1f1a" />
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  className="fill-white text-2xl font-bold"
                  transform="rotate(90 100 100)"
                >
                  {totalCount}
                </text>
                <text
                  x="100"
                  y="110"
                  textAnchor="middle"
                  className="fill-gray-400 text-xs"
                  transform="rotate(90 100 100)"
                >
                  зарядок
                </text>
              </svg>
            </div>
            
            {/* Легенда */}
            <div className="flex-1 space-y-3">
              {chartData.map((week, index) => {
                const percentage = totalCount > 0 ? ((week.count / totalCount) * 100).toFixed(1) : 0;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors[index] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 text-sm">{week.label}</span>
                        <span className="text-white font-semibold">{week.count} ({percentage}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            Нет зарядок за последние 30 дней
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="text-emerald-400" size={24} />
          <h3 className="text-white text-xl font-semibold">
            Последняя активность
          </h3>
        </div>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-[#0a1f1a] rounded-lg hover:bg-[#0a1f1a]/70 transition-colors"
              >
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    {formatActivityMessage(activity)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            Нет активности за последние 24 часа
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
        <h3 className="text-white text-lg font-semibold mb-4">Статус системы</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-[#0a1f1a] rounded-lg">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <span className="text-gray-300 text-sm">Сервер работает</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#0a1f1a] rounded-lg">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <span className="text-gray-300 text-sm">Платежи доступны</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#0a1f1a] rounded-lg">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <span className="text-gray-300 text-sm">Карты работают</span>
          </div>
        </div>
      </div>
    </div>
  );
}
