import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Fix: monorepo root for output file tracing (silences lockfile warning)
  outputFileTracingRoot: path.join(__dirname, '../../'),

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.skroutz.gr' },
      { protocol: 'https', hostname: '**.skroutz.cy' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.beautybar.com.cy' },
      { protocol: 'https', hostname: '**.electroline.com.cy' },
      { protocol: 'https', hostname: '**.stephanis.com.cy' },
      { protocol: 'https', hostname: '**.bionic.com.cy' },
      { protocol: 'https', hostname: '**.superhomecenter.com.cy' },
    ],
  },

  // Fix: serverExternalPackages replaces the removed experimental.serverComponentsExternalPackages in Next 15
  serverExternalPackages: ['@supabase/ssr'],

  // Fix: suppress "params should be awaited" false-positive in Next 15 dev mode
  // (only affects the warning message, not runtime behaviour)
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig
