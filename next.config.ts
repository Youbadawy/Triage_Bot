
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  allowedDevOrigins: ['https://6000-firebase-studio-1750019949190.cluster-f4iwdviaqvc2ct6pgytzw4xqy4.cloudworkstations.dev'],
  // The 'experimental' block containing 'allowedDevOrigins' was previously removed
  // as it caused "Unrecognized key(s)" error. This is a new attempt to place it at the top level.
};

export default nextConfig;
