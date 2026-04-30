'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      router.push('/auth/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    if (step === 'code') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value && newCode.every(c => c)) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);

    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerifyCode(pastedData);
    }
  };

  const handleVerifyCode = async (codeValue?: string) => {
    const finalCode = codeValue || code.join('');
    
    if (finalCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Просто проверяем код БЕЗ пометки как использованный
      const verificationCode = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: finalCode, 
          type: 'reset_password',
          skipMarkAsUsed: true // Не помечать как использованный
        }),
      });

      const data = await verificationCode.json();

      if (!verificationCode.ok) {
        throw new Error(data.error || 'Неверный код');
      }

      // Код правильный - переходим к вводу нового пароля
      setStep('password');
    } catch (err: any) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);

    try {
      // Сбрасываем пароль (код будет проверен и помечен как использованный внутри API)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: code.join(''), 
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          throw new Error(data.details.join('\n'));
        }
        throw new Error(data.error || 'Ошибка сброса пароля');
      }

      // Успешно - переходим на страницу входа
      router.push('/auth/signin?reset=success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить код');
      }

      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

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
          {step === 'code' ? (
            <>
              {/* Code Step */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Введите код
                </h1>
                <p className="text-gray-400">
                  Мы отправили 6-значный код на
                </p>
                <p className="text-emerald-400 font-medium mt-1">{email}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center whitespace-pre-line">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className="w-12 h-14 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg text-white text-center text-2xl font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerifyCode()}
                disabled={loading || code.some(c => !c)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition mb-4"
              >
                {loading ? 'Проверка...' : 'Продолжить'}
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">
                  Не получили код?
                </p>
                <button
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium disabled:text-gray-500 disabled:cursor-not-allowed transition"
                >
                  {resending ? 'Отправка...' : countdown > 0 ? `Отправить повторно (${countdown}с)` : 'Отправить повторно'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Password Step */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Новый пароль
                </h1>
                <p className="text-gray-400">
                  Создайте новый безопасный пароль
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Новый пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      required
                      className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="text-gray-500 text-xs mt-2 space-y-1">
                    <p>Пароль должен содержать:</p>
                    <ul className="list-disc list-inside pl-2">
                      <li>Минимум 8 символов</li>
                      <li>Заглавные и строчные буквы</li>
                      <li>Минимум 1 цифру</li>
                      <li>Минимум 1 спецсимвол (!@#$%^&*)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">Повторите пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите пароль"
                      required
                      className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
                >
                  {loading ? 'Сохранение...' : 'Сбросить пароль'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link 
            href="/auth/signin" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-400 text-sm transition"
          >
            <ArrowLeft size={16} />
            Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
