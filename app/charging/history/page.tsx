'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';

export default function ChargingHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/profile"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">История зарядок</h1>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <History className="text-emerald-400" size={48} />
          </div>
          <h2 className="text-xl font-bold mb-2">Нет зарядок</h2>
          <p className="text-gray-400 text-center mb-8">
            История ваших зарядных сессий появится здесь
          </p>
        </div>

        {/* Coming Soon */}
        <div className="mt-8 bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6 text-center">
          <p className="text-gray-400">
            🚧 История зарядок будет доступна после первой зарядной сессии
          </p>
        </div>
      </div>
    </div>
  );
}
