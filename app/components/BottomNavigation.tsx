'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Wallet, History, MoreHorizontal } from 'lucide-react';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Определяем активную вкладку на основе текущего пути
  const getActiveTab = () => {
    if (pathname === '/map' || pathname === '/') return 'map';
    if (pathname === '/balance') return 'balance';
    if (pathname.startsWith('/bookings') || pathname.startsWith('/charging/history')) return 'history';
    if (pathname.startsWith('/profile') || pathname.startsWith('/vehicles') || pathname.startsWith('/charging/rules')) return 'more';
    return '';
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f2d26] border-t border-emerald-900/30 safe-area-inset-bottom">
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {/* Главная */}
          <button
            onClick={() => router.push('/map')}
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className={`p-2 rounded-lg transition ${
              activeTab === 'map' ? 'bg-emerald-500/20' : ''
            }`}>
              <Home 
                size={24} 
                className={activeTab === 'map' ? 'text-emerald-400' : 'text-white'}
              />
            </div>
            <span className={`text-xs ${
              activeTab === 'map' ? 'text-emerald-400 font-medium' : 'text-white'
            }`}>
              Главная
            </span>
          </button>

          {/* Кошелек */}
          <button
            onClick={() => router.push('/balance')}
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className={`p-2 rounded-lg transition ${
              activeTab === 'balance' ? 'bg-emerald-500/20' : ''
            }`}>
              <Wallet 
                size={24} 
                className={activeTab === 'balance' ? 'text-emerald-400' : 'text-white'}
              />
            </div>
            <span className={`text-xs ${
              activeTab === 'balance' ? 'text-emerald-400 font-medium' : 'text-white'
            }`}>
              Кошелек
            </span>
          </button>

          {/* История */}
          <button
            onClick={() => router.push('/bookings')}
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className={`p-2 rounded-lg transition ${
              activeTab === 'history' ? 'bg-emerald-500/20' : ''
            }`}>
              <History 
                size={24} 
                className={activeTab === 'history' ? 'text-emerald-400' : 'text-white'}
              />
            </div>
            <span className={`text-xs ${
              activeTab === 'history' ? 'text-emerald-400 font-medium' : 'text-white'
            }`}>
              История
            </span>
          </button>

          {/* Еще */}
          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className={`p-2 rounded-lg transition ${
              activeTab === 'more' ? 'bg-emerald-500/20' : ''
            }`}>
              <MoreHorizontal 
                size={24} 
                className={activeTab === 'more' ? 'text-emerald-400' : 'text-white'}
              />
            </div>
            <span className={`text-xs ${
              activeTab === 'more' ? 'text-emerald-400 font-medium' : 'text-white'
            }`}>
              Еще
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}