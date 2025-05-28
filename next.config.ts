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
  // Turbopack specific configuration, may not be needed for all framer-motion versions
  // experimental: {
  //   turbo: {
  //     resolveAlias: {
  //       // If you're using styled-components
  //       // "styled-components": "styled-components",
  //     },
  //   },
  // },
};

export default nextConfig;
