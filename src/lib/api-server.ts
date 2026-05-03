import { cookies } from 'next/headers'
import type { BackendAgentProfile, BackendTool, DataSource, Tenant } from '@/types'
import type { TenantKpis, TimeSeriesPoint } from '@/api/apiService'
import { AUTH_COOKIE } from '@/lib/auth'

const TENANT_URL = process.env.TENANT_API_URL ?? 'http://localhost:8080'
const METRICAS_URL = process.env.METRICAS_API_URL ?? 'http://localhost:8091'

async function serverFetch<T>(path: string, baseUrl = TENANT_URL): Promise<T> {
  const store = await cookies()
  const token = store.get(AUTH_COOKIE)?.value

  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status} — ${path}`)
  }

  return res.json() as Promise<T>
}

export async function serverGetTenants(): Promise<Tenant[]> {
  const res = await serverFetch<{ data: Tenant[] }>('/api/v1/tenants')
  return res.data
}

export async function serverGetTenant(id: string): Promise<Tenant> {
  return serverFetch<Tenant>(`/api/v1/tenants/${id}`)
}

export async function serverGetDataSources(tenantId: string): Promise<DataSource[]> {
  const res = await serverFetch<{ data: DataSource[] }>(`/api/v1/tenants/${tenantId}/data-sources`)
  return res.data
}

export async function serverGetProfiles(tenantId: string): Promise<BackendAgentProfile[]> {
  const res = await serverFetch<{ data: BackendAgentProfile[] }>(`/api/v1/tenants/${tenantId}/profiles`)
  return res.data
}

export async function serverGetToolRegistry(): Promise<BackendTool[]> {
  const res = await serverFetch<{ data: BackendTool[] }>('/api/v1/tool-registry')
  return res.data
}

export async function serverGetKpis(): Promise<{ data: TenantKpis[] | null }> {
  return serverFetch<{ data: TenantKpis[] | null }>('/stats/kpis', METRICAS_URL)
}

export async function serverGetTimeSeries(
  days = 7,
  tenantId?: string,
): Promise<{ data: TimeSeriesPoint[] | null }> {
  const params = new URLSearchParams({ days: String(days) })
  if (tenantId) params.set('tenant_id', tenantId)
  return serverFetch<{ data: TimeSeriesPoint[] | null }>(
    `/stats/timeseries?${params}`,
    METRICAS_URL,
  )
}
