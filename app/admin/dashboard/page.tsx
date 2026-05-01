'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Zap
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface DashboardStats {
  totalUsers: number;
  totalStations: number;
  activeBookings: number;
  totalRevenue: number;
  activeSessions: number;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a]">
      {/* Header */}
      <header className="bg-[#0f2d26] border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-emerald-900/30 border border-emerald-500/30">
                <Image 
                  src="/logo12.png" 
                  alt="ChargeFlow" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ChargeFlow Admin</h1>
                <p className="text-xs text-gray-400">Панель администратора</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Shield className="text-amber-500" size={20} />
                <div>
                  <p className="text-white text-sm font-medium">
                    {user?.name || 'Администратор'}
                  </p>
                  <p className="text-gray-400 text-xs">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition"
                title="Выйти"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Добро пожаловать, {user?.name || 'Администратор'}!
          </h2>
          <p className="text-gray-400">
            Управляйте системой зарядных станций
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-emerald-500" size={24} />
              </div>
              <span className="text-emerald-400 text-sm font-medium">+12%</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Всего пользователей</h3>
            <p className="text-white text-3xl font-bold">
              {stats?.totalUsers || 0}
            </p>
          </div>

          {/* Total Stations */}
          <div className="bg-[#0f2d26] border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MapPin className="text-blue-500" size={24} />
              </div>
              <span className="text-blue-400 text-sm font-medium">+5</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Станций</h3>
            <p className="text-white text-3xl font-bold">
              {stats?.totalStations || 0}
            </p>
          </div>

          {/* Active Bookings */}
          <div className="bg-[#0f2d26] border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-amber-500" size={24} />
              </div>
              <span className="text-amber-400 text-sm font-medium">Активно</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Бронирований</h3>
            <p className="text-white text-3xl font-bold">
              {stats?.activeBookings || 0}
            </p>
          </div>

          {/* Active Sessions */}
          <div className="bg-[#0f2d26] border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Zap className="text-purple-500" size={24} />
              </div>
              <span className="text-purple-400 text-sm font-medium">Сейчас</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Активных сессий</h3>
            <p className="text-white text-3xl font-bold">
              {stats?.activeSessions || 0}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Management */}
          <button className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 text-left hover:border-emerald-500 transition group">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition">
              <Users className="text-emerald-500" size={24} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Управление пользователями
            </h3>
            <p className="text-gray-400 text-sm">
              Просмотр, редактирование и блокировка пользователей
            </p>
          </button>

          {/* Stations Management */}
          <button className="bg-[#0f2d26] border border-blue-500/30 rounded-xl p-6 text-left hover:border-blue-500 transition group">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
              <MapPin className="text-blue-500" size={24} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Управление станциями
            </h3>
            <p className="text-gray-400 text-sm">
              Добавление, редактирование и мониторинг станций
            </p>
          </button>

          {/* Bookings */}
          <button className="bg-[#0f2d26] border border-amber-500/30 rounded-xl p-6 text-left hover:border-amber-500 transition group">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500/30 transition">
              <Calendar className="text-amber-500" size={24} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Бронирования
            </h3>
            <p className="text-gray-400 text-sm">
              Просмотр и управление бронированиями
            </p>
          </button>

          {/* Analytics */}
          <button className="bg-[#0f2d26] border border-purple-500/30 rounded-xl p-6 text-left hover:border-purple-500 transition group">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition">
              <BarChart3 className="text-purple-500" size={24} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Аналитика
            </h3>
            <p className="text-gray-400 text-sm">
              Статистика и отчеты по использованию
            </p>
          </button>

          {/* Revenue */}
          <button className="bg-[#0f2d26] border border-green-500/30 rounded-xl p-6 text-left hover:border-green-500 transition group">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition">
              <DollarSign className="text-green-500" size={24} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Финансы
            </h3>
            <p className="text-gray-400 text-sm">
              Доходы, платежи и транзакции
            </p>
          </button>

          {/* Settings */}
          <button className="bg-[#0f2d26] border border-gray-500/30 rounded-xl p-6 text-left hover:border-gray-500 transition group">
            <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-500/30 transition">
              <Settings className="text-gray-400" size={24} />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Настройки
            </h3>
            <p className="text-gray-400 text-sm">
              Конфигурация системы и параметры
            </p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-emerald-500" size={24} />
            <h3 className="text-white text-xl font-semibold">
              Последняя активность
            </h3>
          </div>
          <div className="text-gray-400 text-center py-8">
            Функция в разработке
          </div>
        </div>
      </main>
    </div>
  );
}
