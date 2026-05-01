'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, ArrowLeft } from 'lucide-react';

function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!email) {
      router.push('/admin/signin');
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!code || code.length !== 6) {
        throw new Error('Введите 6-значный код');
      }

      // Проверяем код
      const response = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Неверный код');
      }

      // Успешная авторизация - переходим в админ-панель
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      // Получаем password из sessionStorage
      const password = sessionStorage.getItem('admin-password');
      
      if (!password) {
        throw new Error('Пароль не найден. Вернитесь на страницу входа');
      }

      const response = await fetch('/api/admin/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки кода');
      }

      setError('');
      alert('Код отправлен повторно');
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
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Shield className="text-amber-500" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              Подтверждение входа
            </h1>
            <p className="text-gray-400 text-center">
              Введите код из Telegram
            </p>
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 text-sm text-center">
                📱 Код отправлен в Telegram
              </p>
            </div>
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
                6-значный код
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                }}
                placeholder="000000"
                maxLength={6}
                required
                className="w-full bg-[#0a1f1a] border border-amber-900/30 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="w-full text-amber-400 hover:text-amber-300 text-sm transition"
            >
              Отправить код повторно
            </button>
          </form>
        </div>

        {/* Back to Sign In */}
        <div className="mt-6 text-center">
          <Link 
            href="/admin/signin" 
            className="text-gray-400 hover:text-amber-400 text-sm transition inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminVerifyCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    }>
      <VerifyCodeForm />
    </Suspense>
  );
}
