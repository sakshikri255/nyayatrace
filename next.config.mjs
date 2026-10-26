import withPWA from '@ducanh2912/next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses (gzip) — reduces payload on every page load
  compress: true,

  // Remove X-Powered-By header (minor security + bandwidth)
  poweredByHeader: false,

  experimental: {
    serverComponentsExternalPackages: [
      '@napi-rs/canvas',
      'tesseract.js',
      'pdfjs-dist',
      'better-sqlite3',
    ],
    // Tree-shake large packages — only import used icons/utilities
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@base-ui/react',
      'sonner',
    ],
  },
}

// Only wrap with PWA plugin in production to avoid Turbopack webpack-config warnings in dev
const isDev = process.env.NODE_ENV === 'development'

export default isDev
  ? nextConfig
  : withPWA({
      dest: 'public',
      cacheOnFrontEndNav: true,
      aggressiveFrontEndNavCaching: true,
      reloadOnOnline: true,
      workboxOptions: {
        disableDevLogs: true,
        runtimeCaching: [
          {
            urlPattern: /^\/(?:overview|cases|cause-list|concordance)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'page-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    })(nextConfig)
