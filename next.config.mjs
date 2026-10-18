/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@napi-rs/canvas',
      'tesseract.js',
      'pdfjs-dist',
      'better-sqlite3',
    ],
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
      config.externals.push({
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
        'tesseract.js': 'commonjs tesseract.js',
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }
    return config;
  },
};

export default nextConfig;
