'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';

function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const email = searchParams.get('email');
  const password = searchParams.get('password');
  const type = searchParams.get('type') || 'login';

  useEffect(() => {
    if (!email || !password) {
      router.push('/auth/signin');
    }
  }, [email, password, router]);

  useEffect(() => {
    // Фокус на первом поле при загрузке
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Только цифры

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Берем только последний символ
    setCode(newCode);

    // Автоматический переход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Автоматическая отправка при заполнении всех полей
    if (index === 5 && value && newCode.every(c => c)) {
      handleSubmit(newCode.join(''));
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

    // Фокус на последнем заполненном поле
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    // Автоматическая отправка если вставили все 6 цифр
    if (pastedData.length === 6) {
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (codeValue?: string) => {
    const finalCode = codeValue || code.join('');
    
    if (finalCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Проверяем код
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: finalCode, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Неверный код');
      }

      // Код правильный - входим через NextAuth
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Успешный вход
      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить код');
      }

      setCountdown(60); // 60 секунд до следующей отправки
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
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Введите код
            </h1>
            <p className="text-gray-400">
              Мы отправили 6-значный код на
            </p>
            <p className="text-emerald-400 font-medium mt-1">{email}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Code Input */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg text-white text-center text-2xl font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={loading || code.some(c => !c)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition mb-4"
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>

          {/* Resend Code */}
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

export default function VerifyCodePage() {
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
