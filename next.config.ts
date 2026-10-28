import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: false,
  webpack: (config) => {
    // Workaround for Webpack 5 module concatenation issue in Next.js 15.5 causing "Unexpected end of JSON input"
    config.optimization.concatenateModules = false;
    return config;
  },
};

export default nextConfig;
