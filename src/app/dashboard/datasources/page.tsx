'use client'

import { useEffect, useState } from 'react'
import { decodeJwt, getAuthCookieClient } from '@/lib/auth'
import { DataSourcesManager } from '@/features/datasources/DataSourcesManager'

export default function DataSourcesPage() {
  const [tenantId, setTenantId] = useState<string>('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getAuthCookieClient()
    const payload = token ? decodeJwt(token) : null
    setTenantId(payload?.tenant_id ?? '')
    setReady(true)
  }, [])

  if (!ready) return null
  // No tenant_id (e.g. app_admin) → let the manager read from the TenantSwitcher store.
  if (!tenantId) return <DataSourcesManager />
  return <DataSourcesManager tenantId={tenantId} />
}
