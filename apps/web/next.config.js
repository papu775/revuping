//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only repository photography belongs in the shared optimization cache.
    localPatterns: [{ pathname: '/images/**', search: '' }],
  },
  async headers() {
    const development = process.env.NODE_ENV === 'development';
    // Inline scripts/styles are required by Next hydration, next-themes and the
    // current presentation. Eval is restricted to the development runtime.
    const policy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'" + (development ? ' ws: wss:' : ''),
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: policy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
