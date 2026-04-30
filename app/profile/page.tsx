'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, History, FileText, Bell, Trash2, LogOut, ChevronRight, Car, Eye, EyeOff, X } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Введите пароль для подтверждения');
      return;
    }

    setDeleteError('');
    setDeleteLoading(true);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка удаления аккаунта');
      }

      // Успешно удалено - выходим и переходим на главную
      await signOut({ callbackUrl: '/' });
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            {userData?.name || session?.user?.name || session?.user?.email?.split('@')[0] || 'Пользователь'}
          </h1>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {/* Phone */}
          <Link
            href="/profile/phone"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Phone className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Телефон</p>
                <p className="text-white font-medium">
                  {userData?.phone || '+996 ___ ___ ___'}
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* Email */}
          <div className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Mail className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white font-medium">{session.user?.email}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </div>

          {/* My Vehicles */}
          <Link
            href="/vehicles"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Car className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">Мои автомобили</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* Charging History */}
          <Link
            href="/charging/history"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <History className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">История зарядок</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* Charging Rules */}
          <Link
            href="/charging/rules"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <FileText className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">Правила зарядок</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={24} />
          </Link>

          {/* Notifications */}
          <Link
            href="/profile/notifications"
            className="flex items-center justify-between bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Bell className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">Уведомления</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Вкл</span>
              <ChevronRight className="text-gray-400" size={24} />
            </div>
          </Link>

          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between bg-[#0f2d26] border border-red-900/30 rounded-xl p-4 hover:border-red-500/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-400" size={24} />
              </div>
              <div>
                <p className="text-red-400 font-medium">Удалить аккаунт</p>
              </div>
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-4 rounded-full font-medium transition"
          >
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <LogOut size={24} />
            </div>
            <span className="text-lg">Выход</span>
          </button>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-emerald-400 text-sm transition">
            ← Вернуться на главную
          </Link>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-red-400">Удалить аккаунт</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">
                <strong>⚠️ Внимание!</strong> Это действие необратимо. Все ваши данные будут удалены:
              </p>
              <ul className="text-red-400 text-sm mt-2 ml-4 list-disc">
                <li>Профиль и настройки</li>
                <li>История зарядок</li>
                <li>Автомобили</li>
                <li>Бронирования</li>
                <li>Баланс</li>
              </ul>
            </div>

            {/* Error Message */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {deleteError}
              </div>
            )}

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 text-sm">
                Введите пароль для подтверждения
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Ваш пароль"
                  className="w-full bg-[#0a1f1a] border border-red-900/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  disabled={deleteLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="flex-1 bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-gray-300 py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
              >
                {deleteLoading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
