import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning — Next.js traces from repo root
  // but our app lives in /frontend, so we point it at the monorepo root
  outputFileTracingRoot: path.join(__dirname, '../../'),

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.skroutz.gr' },
      { protocol: 'https', hostname: '**.skroutz.cy' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.beautybar.com.cy' },
      { protocol: 'https', hostname: '**.electroline.com.cy' },
    ],
  },

  // Recommended for Supabase SSR + App Router
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
}

export default nextConfig
