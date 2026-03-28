import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['mssql', 'puppeteer'],
};

export default nextConfig;
