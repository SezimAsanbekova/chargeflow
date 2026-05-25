import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";
import { cookies } from "next/headers";
import { defaultLocale, type Locale } from "@/app/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChargeFlow - Зарядные станции для электромобилей",
  description:
    "Найдите и забронируйте зарядные станции для вашего электромобиля",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ChargeFlow",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "ChargeFlow",
    title: "ChargeFlow - Зарядные станции для электромобилей",
    description:
      "Найдите и забронируйте зарядные станции для вашего электромобиля",
  },
  twitter: {
    card: "summary",
    title: "ChargeFlow - Зарядные станции для электромобилей",
    description:
      "Найдите и забронируйте зарядные станции для вашего электромобиля",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Читаем язык из cookie на сервере — чтобы lang совпадал между SSR и клиентом
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale");
  const locale: Locale = (localeCookie?.value as Locale) ?? defaultLocale;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // suppressHydrationWarning нужен, потому что браузерные расширения
      // (Chrome, mobile browsers) могут добавлять свои атрибуты к <html>,
      // что вызывает hydration mismatch — это нормально и безопасно игнорировать
      suppressHydrationWarning
    >
      <head>
        <meta name="application-name" content="ChargeFlow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ChargeFlow" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a1f1a" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
