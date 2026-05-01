'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Key, Shield } from 'lucide-react';

export default function AdminSignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Заполните все поля');
      }

      // Отправляем запрос на отправку кода
      const response = await fetch('/api/admin/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Неверный email или пароль');
        } else if (response.status === 404) {
          throw new Error('Пользователь не найден');
        }
        throw new Error(data.error || 'Ошибка отправки кода');
      }

      // Сохраняем password для повторной отправки кода
      sessionStorage.setItem('admin-password', formData.password);
      
      // Переходим на страницу ввода кода
      router.push(`/admin/verify-code?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white text-2xl font-bold">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-emerald-900/30 border border-emerald-500/30">
              <Image 
                src="/logo12.png" 
                alt="ChargeFlow" 
                width={40} 
                height={40}
                className="object-contain"
              />
            </div>
            ChargeFlow
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#0f2d26] border border-amber-500/30 rounded-2xl p-8">
          {/* Header with Shield Icon */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Shield className="text-amber-500" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              Вход в админ-панель
            </h1>
            <p className="text-gray-400 text-center">
              Введите учетные данные администратора
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Email администратора
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                  className="w-full bg-[#0a1f1a] border border-amber-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Пароль
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Введите пароль"
                  required
                  className="w-full bg-[#0a1f1a] border border-amber-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Код будет отправлен в ваш Telegram
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Отправка кода...' : 'Получить код'}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-amber-400 text-sm transition">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
