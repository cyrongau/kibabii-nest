import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.0.207',
      },
      {
        protocol: 'https',
        hostname: 'api.kibabii.generexcom.com',
      }
    ],
  },
};

export default nextConfig;
