'use client'

import { useEffect, useState } from 'react'
import { decodeJwt, getAuthCookieClient } from '@/lib/auth'
import { getAgentProfiles, getToolRegistry } from '@/api/apiService'
import { DashboardProfiles } from '@/features/profiles/DashboardProfiles'
import type { BackendAgentProfile, BackendTool } from '@/types'

// app_admin has no tenant_id; fall back to the demo hospital tenant so the
// page lands on a usable state instead of an empty form.
const DEMO_HOSPITAL_TENANT_ID =
  process.env.NEXT_PUBLIC_DEMO_HOSPITAL_TENANT_ID ??
  'ce5ac1c5-9b16-486a-b091-5468d232a4b8'

export default function ProfilesPage() {
  const [tenantId, setTenantId] = useState<string>('')
  const [initialProfiles, setInitialProfiles] = useState<BackendAgentProfile[]>([])
  const [tools, setTools] = useState<BackendTool[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getAuthCookieClient()
    const payload = token ? decodeJwt(token) : null
    const tid = payload?.tenant_id || DEMO_HOSPITAL_TENANT_ID
    setTenantId(tid)
    Promise.all([
      getAgentProfiles(tid).catch(() => [] as BackendAgentProfile[]),
      getToolRegistry().catch(() => [] as BackendTool[]),
    ]).then(([profiles, toolList]) => {
      setInitialProfiles(profiles)
      setTools(toolList)
      setReady(true)
    })
  }, [])

  if (!ready) return null
  return (
    <DashboardProfiles tenantId={tenantId} initialProfiles={initialProfiles} tools={tools} />
  )
}
