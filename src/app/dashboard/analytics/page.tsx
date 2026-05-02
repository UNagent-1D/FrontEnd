import { cookies } from 'next/headers'
import { decodeJwt } from '@/lib/auth'
import { serverGetKpis, serverGetTimeSeries } from '@/lib/api-server'
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const store = await cookies()
  const token = store.get('auth_token')?.value ?? ''
  const payload = decodeJwt(token)
  const tenantId = payload?.tenant_id || undefined

  const [kpisResult, timeSeriesResult] = await Promise.allSettled([
    serverGetKpis(),
    serverGetTimeSeries(7, tenantId),
  ])

  const initialKpis = kpisResult.status === 'fulfilled' ? kpisResult.value.data ?? [] : []
  const initialTimeSeries = timeSeriesResult.status === 'fulfilled' ? timeSeriesResult.value.data ?? [] : []

  return (
    <AnalyticsDashboard
      initialKpis={initialKpis}
      initialTimeSeries={initialTimeSeries}
      tenantId={tenantId}
    />
  )
}
