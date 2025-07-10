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
  
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 忽略Python文件
    config.module.rules.push({
      test: /\.py$/,
      loader: 'ignore-loader'
    });
    
    // 处理Supabase realtime依赖警告
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // 处理关键依赖警告
    config.module.exprContextCritical = false;
    config.module.unknownContextCritical = false;
    
    return config;
  },
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    BACKEND_URL: process.env.BACKEND_URL,
  },
  
  compress: true,
  
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
    ];
  },
}

export default nextConfig
