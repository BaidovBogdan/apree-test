import type { NextConfig } from 'next';

const apiOrigin = process.env.API_ORIGIN ?? 'http://127.0.0.1:3001';
if (!/^https?:\/\//.test(apiOrigin)) throw new Error('API_ORIGIN must be an HTTP URL');

const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@apree/contracts'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};

export default config;
