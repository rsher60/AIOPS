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

  // Tree-shake heavy packages to only import what's used
  experimental: {
    optimizePackageImports: [
      '@clerk/nextjs',
      'react-markdown',
      'remark',
      'remark-gfm',
      'remark-html',
      'remark-breaks',
      'marked',
      'react-datepicker',
      'docx',
    ],
  },

  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Split large vendor bundles into smaller cacheable chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        maxSize: 200_000, // ~195 KB per chunk
        cacheGroups: {
          // React core — changes rarely, aggressively cached
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 50,
            enforce: true,
          },
          // Clerk auth — large, isolated chunk
          clerk: {
            name: 'clerk',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]@clerk[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Remaining node_modules
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // Shared app code used across multiple pages
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
