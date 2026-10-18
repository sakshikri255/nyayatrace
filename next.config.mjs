/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@base-ui/react',
      'sonner',
    ],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals.push({ '@napi-rs/canvas': 'commonjs @napi-rs/canvas' });
    }
    return config;
  },
};

export default nextConfig;
