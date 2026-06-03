"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  useEffect(() => {
    console.log('🔄 [CALLBACK] Auth callback page loaded:', {
      status,
      hasSession: !!session,
      callbackUrl,
      timestamp: new Date().toISOString()
    });

    if (status === "authenticated") {
      console.log('✅ [CALLBACK] User authenticated, redirecting to:', callbackUrl);
      // Используем window.location для надежного редиректа
      window.location.href = callbackUrl;
    } else if (status === "unauthenticated") {
      console.log('❌ [CALLBACK] User not authenticated, redirecting to signin');
      router.push("/auth/signin");
    }
  }, [status, session, callbackUrl, router]);

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
