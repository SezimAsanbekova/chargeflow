import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['stout-phoney-spearfish.ngrok-free.dev'],
  turbopack: {},
  // Standalone режим для Docker - оптимизирует размер образа
  output: 'standalone',
};

// Экспортируем базовую конфигурацию без PWA (временно отключено)
// PWA можно будет включить позже после полной настройки
export default nextConfig;
