import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['stout-phoney-spearfish.ngrok-free.dev'],
  turbopack: {},
  // Standalone режим для Docker - оптимизирует размер образа
  output: 'standalone',
  // CSP заголовки для работы PWA и Service Worker
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self' blob:; frame-src 'self' https:;"
          }
        ]
      }
    ]
  }
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
