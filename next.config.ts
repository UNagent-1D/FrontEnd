import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'standalone',
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
