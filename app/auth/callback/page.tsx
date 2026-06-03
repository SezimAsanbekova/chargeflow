"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Предотвращаем множественные редиректы
    if (hasRedirected) return;

    console.log('🔄 [CALLBACK] Auth callback page loaded:', {
      status,
      hasSession: !!session,
      callbackUrl,
      timestamp: new Date().toISOString()
    });

    if (status === "authenticated") {
      console.log('✅ [CALLBACK] User authenticated, redirecting to:', callbackUrl);
      setHasRedirected(true);
      
      // Небольшая задержка перед редиректом
      setTimeout(() => {
        router.push(callbackUrl);
      }, 500);
    } else if (status === "unauthenticated") {
      console.log('❌ [CALLBACK] User not authenticated, redirecting to signin');
      setHasRedirected(true);
      router.push("/auth/signin");
    }
  }, [status, session, callbackUrl, router, hasRedirected]);

  return (
    <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Завершение входа...</p>
        <p className="text-gray-400 text-sm mt-2">Перенаправление...</p>
      </div>
    </div>
  );
}
