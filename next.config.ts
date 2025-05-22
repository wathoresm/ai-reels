import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true, // ✅ disables ESLint errors from failing the build
  },
};

export default nextConfig;
