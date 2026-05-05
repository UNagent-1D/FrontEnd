import { cookies } from 'next/headers'
import { decodeJwt } from '@/lib/auth'
import { serverGetDataSources } from '@/lib/api-server'
import { DataSourcesManager } from '@/features/datasources/DataSourcesManager'
import type { DataSource } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DataSourcesPage() {
  const store = await cookies()
  const token = store.get('auth_token')?.value ?? ''
  const payload = decodeJwt(token)
  const tenantId = payload?.tenant_id ?? ''

  // app_admin has no tenant_id in the JWT — let the client read it from the
  // TenantSwitcher store instead of passing an empty string that overrides it.
  if (!tenantId) {
    return <DataSourcesManager />
  }

  let initialData: DataSource[] = []
  try {
    initialData = await serverGetDataSources(tenantId)
  } catch {
    // shows empty state; client retries
  }

  return <DataSourcesManager initialData={initialData} tenantId={tenantId} />
}
