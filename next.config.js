const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pdf-parse', 'pdf2json', 'pdfjs-dist'],
  
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    config.module.exprContextCritical = false
    config.module.unknownContextCritical = false
    
    return config
  },
  
  compress: true,
  
  experimental: {
    ppr: false,
  },
  
  output: 'standalone',
  
  // 跳过有问题的页面预渲染
  skipTrailingSlashRedirect: true,
  
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 