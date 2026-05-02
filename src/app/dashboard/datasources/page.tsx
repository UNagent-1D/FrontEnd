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

  let initialData: DataSource[] = []
  if (tenantId) {
    try {
      initialData = await serverGetDataSources(tenantId)
    } catch {
      // shows empty state; client retries
    }
  }

  return <DataSourcesManager initialData={initialData} tenantId={tenantId} />
}
