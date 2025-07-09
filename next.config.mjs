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
    domains: ['your-domain.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Vercel 部署优化
  output: 'standalone',
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  // 减少包大小
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // API 路由配置
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
}

export default nextConfig
