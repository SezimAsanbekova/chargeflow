'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Settings, 
  LogOut,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import AdminHeader from './components/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Не показываем sidebar на страницах входа
  const isAuthPage = pathname === '/admin/signin' || pathname === '/admin/verify-code';

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { name: 'Дашборд', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Пользователи', href: '/admin/users', icon: Users },
    { name: 'Станции', href: '/admin/stations', icon: MapPin },
    { name: 'Бронирования', href: '/admin/bookings', icon: Calendar },
    { name: 'Финансы', href: '/admin/finance', icon: DollarSign },
    { name: 'Настройки', href: '/admin/settings', icon: Settings },
  ];

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#0a1f1a]">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#0f2d26] border-r border-emerald-500/30 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-500/30">
          <Link href="/admin/dashboard" className={`flex items-center gap-2 ${!sidebarOpen && 'mx-auto'}`}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-emerald-900/30 border border-emerald-500/30">
              <Image 
                src="/logo12.png" 
                alt="ChargeFlow" 
                width={40} 
                height={40}
                className="object-cover"
              />
            </div>
            {sidebarOpen && <span className="font-bold text-white">ChargeFlow</span>}
          </Link>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-emerald-500/10 rounded-lg transition text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Toggle button when closed */}
        {!sidebarOpen && (
          <div className="px-2 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full p-2 hover:bg-emerald-500/10 rounded-lg transition text-gray-400 hover:text-white flex items-center justify-center"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-gray-400 hover:bg-emerald-500/10 hover:text-white'
                  } ${!sidebarOpen && 'justify-center'}`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon size={20} />
                  {sidebarOpen && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-emerald-500/30 p-4">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition w-full ${
              !sidebarOpen && 'justify-center'
            }`}
            title={!sidebarOpen ? 'Выйти' : undefined}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium text-sm">Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
