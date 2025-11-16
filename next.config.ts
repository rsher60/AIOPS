import type { NextConfig } from "next";

// Use static export for production builds, dev mode for development
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Only use static export in production
  ...(isProd && { output: "export" }),

  images: {
    unoptimized: true, // required for static export
  },

  // In development, proxy API calls to FastAPI backend
  ...(!isProd && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    },
  }),
};

export default nextConfig;
