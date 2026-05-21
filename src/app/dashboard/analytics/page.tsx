'use client'

import { useEffect, useState } from 'react'
import { decodeJwt, getAuthCookieClient } from '@/lib/auth'
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  const [tenantId, setTenantId] = useState<string | undefined>(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getAuthCookieClient()
    const payload = token ? decodeJwt(token) : null
    setTenantId(payload?.tenant_id || undefined)
    setReady(true)
  }, [])

  if (!ready) return null
  return <AnalyticsDashboard tenantId={tenantId} />
}
