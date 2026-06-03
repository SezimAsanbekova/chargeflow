"use client";

import { useState, Suspense, useEffect } from "react";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "error" | "info";
  }>({
    show: false,
    message: "",
    type: "error",
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "auth").then(setT);
  }, [locale]);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  // Перенаправляем авторизованного пользователя
  useEffect(() => {
    console.log('🔍 [AUTH STATUS]', {
      status,
      callbackUrl,
      pathname: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    
    if (status === "authenticated") {
      console.log('✅ [SIGNIN] User authenticated, redirecting to:', {
        callbackUrl,
        timestamp: new Date().toISOString()
      });
      
      // Используем router для SPA навигации без полной перезагрузки
      router.push(callbackUrl);
    } else if (status === "unauthenticated") {
      console.log('ℹ️ [SIGNIN] User not authenticated');
    } else if (status === "loading") {
      console.log('⏳ [SIGNIN] Auth status loading...');
    }
  }, [status, callbackUrl, router]);

  // Don't render form until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center p-4">
        <div className="text-white">{t?.signin?.loading ?? "Загрузка..."}</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        console.log('🔐 [CREDENTIALS] Login attempt:', {
          email: formData.email,
          timestamp: new Date().toISOString()
        });
        
        // Вход - БЕЗ кода, сразу входим
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        console.log('📊 [CREDENTIALS] Login result:', {
          ok: result?.ok,
          status: result?.status,
          error: result?.error,
          timestamp: new Date().toISOString()
        });

        if (result?.error) {
          console.error('❌ [CREDENTIALS] Login error:', result.error);
          
          // Проверяем, является ли это ошибкой Google-аккаунта
          if (result.error.includes("создан через Google")) {
            setToast({
              show: true,
              message: "Этот аккаунт создан через Google. Войдите через Google",
              type: "info",
            });
            // Скрываем через 5 секунд
            setTimeout(() => {
              setToast({ show: false, message: "", type: "error" });
            }, 5000);
          } else {
            setError(result.error);
          }
        } else {
          console.log('✅ [CREDENTIALS] Login successful, redirecting to:', callbackUrl);
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        console.log('📝 [REGISTER] Registration attempt:', {
          email: formData.email,
          name: formData.name,
          timestamp: new Date().toISOString()
        });
        
        // Регистрация - С кодом
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        console.log('📊 [REGISTER] Registration response:', {
          ok: response.ok,
          status: response.status,
          data,
          timestamp: new Date().toISOString()
        });

        if (!response.ok) {
          console.error('❌ [REGISTER] Registration error:', data);
          
          // Показываем детальные ошибки валидации пароля
          if (data.details && Array.isArray(data.details)) {
            throw new Error(data.details.join("\n"));
          }
          throw new Error(data.error || "Ошибка регистрации");
        }

        console.log('✅ [REGISTER] Registration successful, sending verification code');

        // После регистрации отправляем код
        const codeResponse = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            type: "registration",
          }),
        });

        const codeData = await codeResponse.json();

        console.log('📊 [REGISTER] Code sending response:', {
          ok: codeResponse.ok,
          status: codeResponse.status,
          timestamp: new Date().toISOString()
        });

        if (!codeResponse.ok) {
          console.error('❌ [REGISTER] Code sending error:', codeData);
          throw new Error(codeData.error || "Ошибка отправки кода");
        }

        console.log('✅ [REGISTER] Code sent, redirecting to verification');

        // Переходим на страницу ввода кода
        router.push(
          `/auth/verify-code?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}&type=registration`,
        );
      }
    } catch (err) {
      console.error('❌ [SIGNIN] Form submission error:', {
        error: err,
        message: (err as Error)?.message,
        stack: (err as Error)?.stack,
        timestamp: new Date().toISOString()
      });
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('🔐 [SIGNIN] Starting Google sign in:', {
        callbackUrl,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      
      // Используем window.location для более надежного редиректа
      const result = await signIn("google", { 
        callbackUrl,
        redirect: true, // Автоматический редирект
      });
      
      console.log('✅ [SIGNIN] Google sign in initiated:', result);
    } catch (err) {
      console.error('❌ [SIGNIN] Google sign in error:', {
        error: err,
        message: (err as Error)?.message,
        stack: (err as Error)?.stack,
        timestamp: new Date().toISOString()
      });
      setError("Ошибка входа через Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/?show=landing"
            className="inline-flex items-center gap-2 text-white text-2xl font-bold"
          >
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
              {isLogin
                ? (t?.signin?.loginTitle ?? "Вход")
                : (t?.signin?.registerTitle ?? "Регистрация")}
            </h1>
            <p className="text-gray-400">
              {isLogin
                ? (t?.signin?.loginSubtitle ?? "Войдите в свой аккаунт")
                : (t?.signin?.registerSubtitle ??
                  "Создайте аккаунт для доступа к зарядным станциям")}
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
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLogin
              ? (t?.signin?.signInWithGoogle ?? "Войти через Google")
              : (t?.signin?.registerWithGoogle ?? "Регистрация через Google")}
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
                <label className="block text-gray-300 mb-2 text-sm">
                  {t?.signin?.nameLabel ?? "Имя"}
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    key="name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t?.signin?.namePlaceholder ?? "Ваше имя"}
                    className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                {t?.signin?.emailLabel ?? "Email"}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  key="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                {t?.signin?.passwordLabel ?? "Пароль"}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  key="password-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={
                    t?.signin?.passwordPlaceholder ?? "Минимум 8 символов"
                  }
                  required
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {!isLogin && (
                <div className="text-gray-500 text-xs mt-2 space-y-1">
                  <p>
                    {t?.signin?.passwordHint?.title ??
                      "Пароль должен содержать:"}
                  </p>
                  <ul className="list-disc list-inside pl-2">
                    <li>
                      {t?.signin?.passwordHint?.minChars ??
                        "Минимум 8 символов"}
                    </li>
                    <li>
                      {t?.signin?.passwordHint?.upperLower ??
                        "Заглавные и строчные буквы"}
                    </li>
                    <li>
                      {t?.signin?.passwordHint?.digit ?? "Минимум 1 цифру"}
                    </li>
                    <li>
                      {t?.signin?.passwordHint?.special ??
                        "Минимум 1 спецсимвол (!@#$%^&*)"}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
            >
              {loading
                ? (t?.signin?.loading ?? "Загрузка...")
                : isLogin
                  ? (t?.signin?.loginButton ?? "Войти")
                  : (t?.signin?.registerButton ?? "Зарегистрироваться")}
            </button>

            {/* Forgot Password Link */}
            {isLogin && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.email) {
                      setError("Введите email для восстановления пароля");
                      return;
                    }

                    setLoading(true);
                    setError("");

                    try {
                      const response = await fetch(
                        "/api/auth/forgot-password",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: formData.email }),
                        },
                      );

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.error || "Ошибка отправки кода");
                      }

                      // Переходим на страницу ввода кода для сброса пароля
                      router.push(
                        `/auth/reset-password?email=${encodeURIComponent(formData.email)}`,
                      );
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-sm transition"
                >
                  {t?.signin?.forgotPassword ?? "Забыли пароль?"}
                </button>
              </div>
            )}
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-gray-400 hover:text-emerald-400 text-sm transition"
            >
              {isLogin
                ? (t?.signin?.noAccount ?? "Нет аккаунта? Зарегистрируйтесь")
                : (t?.signin?.hasAccount ?? "Уже есть аккаунт? Войдите")}
            </button>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/?show=landing"
            className="text-gray-400 hover:text-emerald-400 text-sm transition"
          >
            {t?.signin?.backToHome ?? "← Вернуться на главную"}
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
          <div className="bg-[#0f2d26] border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl shadow-emerald-500/20 max-w-md w-full animate-slide-up pointer-events-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#10b981"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#10b981"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#10b981"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#10b981"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-lg leading-tight">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() =>
                  setToast({ show: false, message: "", type: "error" })
                }
                className="text-gray-400 hover:text-white transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
          <div className="text-white">Загрузка...</div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
