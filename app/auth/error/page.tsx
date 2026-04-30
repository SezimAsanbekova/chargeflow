'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';

const errorMessages: Record<string, string> = {
  Configuration: 'Ошибка конфигурации сервера. Обратитесь к администратору.',
  AccessDenied: 'Доступ запрещен. У вас нет прав для входа.',
  Verification: 'Токен верификации истек или уже был использован.',
  OAuthSignin: 'Ошибка при попытке входа через OAuth провайдера.',
  OAuthCallback: 'Ошибка при обработке ответа от OAuth провайдера.',
  OAuthCreateAccount: 'Не удалось создать аккаунт через OAuth провайдера.',
  EmailCreateAccount: 'Не удалось создать аккаунт с этим email.',
  Callback: 'Ошибка при обработке callback.',
  OAuthAccountNotLinked: 'Email уже используется с другим методом входа.',
  EmailSignin: 'Не удалось отправить письмо для входа.',
  CredentialsSignin: 'Неверный email или пароль.',
  SessionRequired: 'Требуется авторизация для доступа к этой странице.',
  Default: 'Произошла неизвестная ошибка. Попробуйте снова.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    setError(errorParam || 'Default');
  }, [searchParams]);

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#0f2d26] border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Ошибка авторизации</h1>
        <p className="text-gray-400 mb-6">{errorMessage}</p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition"
          >
            Попробовать снова
          </Link>
          <Link
            href="/"
            className="block w-full bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-gray-300 py-3 rounded-lg font-semibold transition border border-emerald-900/30"
          >
            Вернуться на главную
          </Link>
        </div>

        {error && error !== 'Default' && (
          <div className="mt-6 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-500">Код ошибки: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
