import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // !! WARN !!
    // Ignoring TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Ignoring ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
