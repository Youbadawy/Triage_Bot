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
  // The 'experimental' block containing 'allowedDevOrigins' was removed
  // as it caused "Unrecognized key(s)" error.
  // We can re-evaluate how to set allowedDevOrigins if the warning persists
  // and is problematic.
};

export default nextConfig;
