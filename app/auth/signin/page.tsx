'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const callbackUrl = searchParams.get('callbackUrl') || '/profile';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Вход - БЕЗ кода, сразу входим
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        // Регистрация - С кодом
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          // Показываем детальные ошибки валидации пароля
          if (data.details && Array.isArray(data.details)) {
            throw new Error(data.details.join('\n'));
          }
          throw new Error(data.error || 'Ошибка регистрации');
        }

        // После регистрации отправляем код
        const codeResponse = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            type: 'registration',
          }),
        });

        const codeData = await codeResponse.json();

        if (!codeResponse.ok) {
          throw new Error(codeData.error || 'Ошибка отправки кода');
        }

        // Переходим на страницу ввода кода
        router.push(`/auth/verify-code?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}&type=registration`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      setError('Ошибка входа через Google');
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
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-2xl p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Вход' : 'Регистрация'}
            </h1>
            <p className="text-gray-400">
              {isLogin
                ? 'Войдите в свой аккаунт'
                : 'Создайте аккаунт для доступа к зарядным станциям'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLogin ? 'Войти через Google' : 'Регистрация через Google'}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-900/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0f2d26] text-gray-400">или</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Имя</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ваше имя"
                    className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Минимум 8 символов"
                  required
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {!isLogin && (
                <div className="text-gray-500 text-xs mt-2 space-y-1">
                  <p>Пароль должен содержать:</p>
                  <ul className="list-disc list-inside pl-2">
                    <li>Минимум 8 символов</li>
                    <li>Заглавные и строчные буквы</li>
                    <li>Минимум 1 цифру</li>
                    <li>Минимум 1 спецсимвол (!@#$%^&*)</li>
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>

            {/* Forgot Password Link */}
            {isLogin && (
              <div className="text-center mt-3">
                <Link
                  href="/auth/forgot-password"
                  className="text-emerald-400 hover:text-emerald-300 text-sm transition"
                >
                  Забыли пароль?
                </Link>
              </div>
            )}
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-gray-400 hover:text-emerald-400 text-sm transition"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-emerald-400 text-sm transition">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
