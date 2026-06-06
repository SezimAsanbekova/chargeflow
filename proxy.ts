import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { getToken } from 'next-auth/jwt';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Защита админских страниц
  if (pathname.startsWith('/admin')) {
    // Разрешаем доступ к страницам входа
    if (pathname === '/admin/signin' || pathname === '/admin/verify-code') {
      // Если уже авторизован, перенаправляем в dashboard
      const adminToken = request.cookies.get('admin_token')?.value;
      if (adminToken) {
        const payload = await verifyJWT(adminToken);
        if (payload && payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      }
      return NextResponse.next();
    }

    // Проверяем админский токен
    const adminToken = request.cookies.get('admin_token')?.value;
    
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/signin', request.url));
    }

    const payload = await verifyJWT(adminToken);
    
    if (!payload || payload.role !== 'admin') {
      const response = NextResponse.redirect(new URL('/admin/signin', request.url));
      response.cookies.delete('admin_token');
      return response;
    }

    return NextResponse.next();
  }

  // Защита пользовательских страниц (админ может заходить)
  const protectedUserRoutes = ['/profile', '/vehicles', '/booking', '/charging', '/map'];
  const isProtectedUserRoute = protectedUserRoutes.some(route => pathname.startsWith(route));

  if (isProtectedUserRoute) {
    // Сначала проверяем админский токен - админ может заходить
    const adminToken = request.cookies.get('admin_token')?.value;
    if (adminToken) {
      const payload = await verifyJWT(adminToken);
      if (payload && payload.role === 'admin') {
        // Админ может заходить в пользовательскую часть
        return NextResponse.next();
      }
    }

    // Проверяем авторизацию пользователя через NextAuth
    // ВАЖНО: имя cookie должно совпадать с тем, что задано в auth-config.ts
    // (там sessionToken назван 'next-auth.session-token' БЕЗ префикса __Secure-),
    // иначе getToken по умолчанию на https ищет '__Secure-next-auth.session-token'
    // и не находит токен → бесконечный редирект на /auth/signin.
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: 'next-auth.session-token',
      secureCookie: true,
    });

    console.log('🛡️ [MIDDLEWARE] Проверка защищённого маршрута:', {
      pathname,
      hasToken: !!token,
      tokenEmail: (token as any)?.email,
      tokenId: (token as any)?.id,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      cookieNames: request.cookies.getAll().map((c) => c.name),
      timestamp: new Date().toISOString(),
    });

    if (!token) {
      console.warn('⚠️ [MIDDLEWARE] Токен не найден — редирект на /auth/signin', {
        pathname,
        cookieNames: request.cookies.getAll().map((c) => c.name),
      });
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  // НЕ перенаправляем с главной страницы автоматически
  // Пусть пользователи видят landing page
  // if (pathname === '/') {
  //   // Проверяем админский токен
  //   const adminToken = request.cookies.get('admin_token')?.value;
  //   if (adminToken) {
  //     const payload = await verifyJWT(adminToken);
  //     if (payload && payload.role === 'admin') {
  //       return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  //     }
  //   }

  //   // Проверяем пользовательский токен
  //   const token = await getToken({ 
  //     req: request,
  //     secret: process.env.NEXTAUTH_SECRET 
  //   });

  //   if (token) {
  //     return NextResponse.redirect(new URL('/profile', request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/profile/:path*',
    '/vehicles/:path*',
    '/booking/:path*',
    '/charging/:path*',
    '/map/:path*',
  ],
};
