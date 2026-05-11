import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'api.kibabii.generexcom.com',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      }
    ],
  },
  transpilePackages: ['browser-image-compression'],
};

export default nextConfig;
