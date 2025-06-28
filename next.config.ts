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
    
    // Fix for handlebars and OpenTelemetry issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    // Ignore problematic dependencies
    config.externals = {
      ...config.externals,
      handlebars: 'handlebars',
    };
    
    // More aggressive handling of problematic modules
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Handle handlebars completely
    config.module.rules.push({
      test: /node_modules\/handlebars/,
      use: 'null-loader'
    });
    
    // Handle dotprompt module that uses handlebars
    config.module.rules.push({
      test: /node_modules\/dotprompt/,
      use: 'null-loader'
    });
    
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
