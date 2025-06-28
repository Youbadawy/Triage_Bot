import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['lucide-react'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    customKey: 'my-value',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Ensure path mapping works in Firebase build environment
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    // Fix for Node.js modules not available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      module: false,
    };
    
    // Simple fix: ignore handlebars-related modules for client-side builds
    if (!isServer) {
      const originalExternals = config.externals || [];
      config.externals = [
        ...originalExternals,
        'handlebars',
        '@opentelemetry/exporter-jaeger'
      ];
    }
    
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
};

export default nextConfig;
