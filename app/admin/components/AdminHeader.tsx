'use client';

import { useState, useEffect, useRef } from 'react';
import { User, ChevronDown } from 'lucide-react';

interface AdminInfo {
  email: string;
  role: string;
}

export default function AdminHeader() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (response.ok) {
        const data = await response.json();
        setAdminInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin info:', error);
    }
  };

  return (
    <header className="h-16 bg-[#0f2d26] border-b border-emerald-500/30 flex items-center justify-between px-6">
      {/* Left Section - Title or Breadcrumbs */}
      <div className="flex-1">
        <h1 className="text-white text-xl font-semibold">Панель администратора</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Admin Profile */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-2 hover:bg-emerald-500/10 rounded-lg transition"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <User size={16} className="text-emerald-400" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-white text-sm font-medium">
                {adminInfo?.email || 'Администратор'}
              </p>
              <p className="text-gray-400 text-xs">
                {adminInfo?.role || 'Admin'}
              </p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0f2d26] border border-emerald-500/30 rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-emerald-500/30">
                <p className="text-white font-medium">{adminInfo?.email}</p>
                <p className="text-gray-400 text-sm">{adminInfo?.role}</p>
              </div>
              <div className="p-2">
                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-emerald-500/10 rounded-lg transition text-sm">
                  Профиль
                </button>
                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-emerald-500/10 rounded-lg transition text-sm">
                  Настройки
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
