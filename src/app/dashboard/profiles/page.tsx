import { cookies } from 'next/headers'
import { decodeJwt } from '@/lib/auth'
import { serverGetProfiles, serverGetToolRegistry } from '@/lib/api-server'
import { DashboardProfiles } from '@/features/profiles/DashboardProfiles'
import type { BackendAgentProfile, BackendTool } from '@/types'

export const dynamic = 'force-dynamic'

// Single-tenant demo fallback. app_admin has no tenant_id on the JWT, so
// without this fallback the SSR loader skips the fetch and the page lands
// on an empty state. Same constant the rest of the FrontEnd uses.
const DEMO_HOSPITAL_TENANT_ID =
  process.env.NEXT_PUBLIC_DEMO_HOSPITAL_TENANT_ID ??
  'ce5ac1c5-9b16-486a-b091-5468d232a4b8'

export default async function ProfilesPage() {
  const store = await cookies()
  const token = store.get('auth_token')?.value ?? ''
  const payload = decodeJwt(token)
  const tenantId = payload?.tenant_id || DEMO_HOSPITAL_TENANT_ID

  let initialProfiles: BackendAgentProfile[] = []
  let tools: BackendTool[] = []

  try {
    ;[initialProfiles, tools] = await Promise.all([
      serverGetProfiles(tenantId),
      serverGetToolRegistry(),
    ])
  } catch {
    // Surface the empty state; the client can retry via the form.
  }

  return <DashboardProfiles tenantId={tenantId} initialProfiles={initialProfiles} tools={tools} />
}
