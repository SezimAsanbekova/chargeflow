import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['stout-phoney-spearfish.ngrok-free.dev'],
  turbopack: {},
  // Standalone режим для Docker - оптимизирует размер образа
  output: 'standalone',
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
