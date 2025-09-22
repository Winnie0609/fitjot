import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // cross-origin isolation
  allowedDevOrigins: [
    'local-origin.dev',
    '*.local-origin.dev',
    '*.ngrok-free.app',
  ],

  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
