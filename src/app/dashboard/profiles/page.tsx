import { cookies } from 'next/headers'
import { decodeJwt } from '@/lib/auth'
import { serverGetProfiles, serverGetToolRegistry } from '@/lib/api-server'
import { DashboardProfiles } from '@/features/profiles/DashboardProfiles'
import type { BackendAgentProfile, BackendTool } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProfilesPage() {
  const store = await cookies()
  const token = store.get('auth_token')?.value ?? ''
  const payload = decodeJwt(token)
  const tenantId = payload?.tenant_id ?? ''

  let initialProfiles: BackendAgentProfile[] = []
  let tools: BackendTool[] = []

  if (tenantId) {
    try {
      ;[initialProfiles, tools] = await Promise.all([
        serverGetProfiles(tenantId),
        serverGetToolRegistry(),
      ])
    } catch {
      // muestra estado vacío; el cliente puede reintentar
    }
  }

  return <DashboardProfiles tenantId={tenantId} initialProfiles={initialProfiles} tools={tools} />
}
