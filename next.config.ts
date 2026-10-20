import type { NextConfig } from 'next'
import { buildContentSecurityPolicy } from './lib/securityHeaders'

const isProduction = process.env.NODE_ENV === 'production'
const contentSecurityPolicy = buildContentSecurityPolicy(isProduction)

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ['bcryptjs'],
  // Anciennes pages publiques : tout vit désormais sur l'accueil (console + notice).
  async redirects() {
    return [
      { source: '/projets', destination: '/#ludotheque', permanent: true },
      { source: '/experiences', destination: '/#niveaux', permanent: true },
      { source: '/experiences/:id', destination: '/#niveaux', permanent: true },
      { source: '/formation', destination: '/#niveaux', permanent: true },
      { source: '/contact', destination: '/#contact', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), microphone=()',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          ...(isProduction
            ? [{
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains',
              }]
            : []),
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ]
  },
}

export default nextConfig
