import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Отключаем оптимизацию для Storage URL чтобы не было 400 ошибок
    unoptimized: false,
  },
};

export default nextConfig;