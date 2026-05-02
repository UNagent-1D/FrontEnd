import { serverGetTenants } from '@/lib/api-server'
import { GlobalTenants } from '@/features/tenants/GlobalTenants'
import type { Tenant } from '@/types'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  let initialTenants: Tenant[] = []
  try {
    initialTenants = await serverGetTenants()
  } catch {
    // Will show empty state; client-side query retries
  }

  return <GlobalTenants initialTenants={initialTenants} />
}
