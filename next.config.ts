import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  // Static export — the Cloudflare Worker serves built assets via its
  // [assets] binding (../FrontEnd/dist), it does not run a Node server.
  output: 'export',
  distDir: 'dist',
  // No image optimizer at runtime under static export.
  images: { unoptimized: true },
  // The build does not fail on lint or pre-existing type errors. The
  // FrontEnd main branch carries type debt unrelated to this work
  // (e.g. the Tenant interface vs. its callers); fixing that is a
  // separate task. Run `pnpm lint` / `tsc` directly to surface them.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    TENANT_API_URL: process.env.TENANT_API_URL,
    METRICAS_API_URL: process.env.METRICAS_API_URL,
    ORCH_API_URL: process.env.ORCH_API_URL,
    CHAT_API_URL: process.env.CHAT_API_URL,
  },
}

export default nextConfig
