import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Force the standalone output root to this web/ directory so server.js
  // lands at .next/standalone/server.js (not .next/standalone/web/server.js)
  outputFileTracingRoot: require('path').resolve(__dirname),
  serverExternalPackages: ['mssql', 'puppeteer'],
  experimental: {
    // Run webpack in the main process so the fs.readlink patch loaded via
    // `node -r ./patch-readlink.js` (see package.json build script) is active
    // during compilation.  Without this, Next.js spawns a build worker that
    // doesn't inherit the patched fs module.
    webpackBuildWorker: false,
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    config.cache = { type: 'memory' };
    return config;
  },
};

export default nextConfig;
