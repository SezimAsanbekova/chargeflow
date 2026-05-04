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
      <div className="flex items-center justify-center h-screen bg-[#0a1f1a]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Привет, {user?.name || 'Администратор'} 👋
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Users className="text-emerald-400" size={24} />
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
              <MapPin className="text-blue-400" size={24} />
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
              <Calendar className="text-amber-400" size={24} />
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
              <Zap className="text-purple-400" size={24} />
            </div>
            <span className="text-purple-400 text-sm font-medium">Сейчас</span>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Активных сессий</h3>
          <p className="text-white text-3xl font-bold">
            {stats?.activeSessions || 0}
          </p>
        </div>
      </div>

      {/* Revenue Card */}
      {stats?.totalRevenue !== undefined && (
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Общий доход</h3>
              <p className="text-white text-4xl font-bold mb-1">
                {stats.totalRevenue.toLocaleString()} сом
              </p>
              <p className="text-emerald-400 text-sm">За все время</p>
            </div>
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <DollarSign className="text-emerald-400" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="text-emerald-400" size={24} />
          <h3 className="text-white text-xl font-semibold">
            Последняя активность
          </h3>
        </div>
        <div className="text-gray-400 text-center py-8">
          Функция в разработке
        </div>
      </div>
    </div>
  );
}
