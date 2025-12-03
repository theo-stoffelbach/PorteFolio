import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ['bcryptjs', 'jose'],
}

export default nextConfig

