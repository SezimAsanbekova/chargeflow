'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Wallet, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetchBalance();
    }
  }, [session]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/user/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(Number(data.balance) || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 bg-emerald-500/20 rounded-full animate-pulse"></div>
    );
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full transition"
      >
        Войти
      </Link>
    );
  }

  const user = session.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2 transition"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        )}
        <div className="hidden md:block text-left">
          <div className="text-white text-sm font-medium">
            {user?.name || user?.email}
          </div>
          <div className="text-emerald-400 text-xs">
            {typeof balance === 'number' ? balance.toFixed(2) : '0.00'} сом
          </div>
        </div>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-72 bg-[#0f2d26] border border-emerald-500/30 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-emerald-900/30">
              <div className="flex items-center gap-3 mb-3">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">{user?.name || 'Пользователь'}</div>
                  <div className="text-gray-400 text-xs">{user?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2">
                <Wallet size={16} className="text-emerald-400" />
                <span className="text-white text-sm">Баланс:</span>
                <span className="text-emerald-400 font-bold ml-auto">
                  {typeof balance === 'number' ? balance.toFixed(2) : '0.00'} сом
                </span>
              </div>
            </div>

            <div className="p-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-emerald-500/10 rounded-lg transition"
                onClick={() => setShowDropdown(false)}
              >
                <User size={18} />
                <span>Профиль</span>
              </Link>
              <Link
                href="/bookings"
                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-emerald-500/10 rounded-lg transition"
                onClick={() => setShowDropdown(false)}
              >
                <Calendar size={18} />
                <span>Мои бронирования</span>
              </Link>
            </div>

            <div className="p-2 border-t border-emerald-900/30">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <LogOut size={18} />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
