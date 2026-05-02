'use client'

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { type DateRange } from "react-day-picker"
import {
  CheckCircle2,
  MessageCircle,
  MessagesSquare,
  Star,
} from "lucide-react"

import { getAnalyticsKpis, getAnalyticsTimeSeries } from "@/api/apiService"
import { useAuthStore } from "@/store/authStore"
import { getDisplayName } from "@/lib/user"

import { PageHeader } from "@/components/layout/PageHeader"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { KpiCard } from "./KpiCard"
import { ConversationsChart } from "./ConversationsChart"
import { DateRangePicker } from "./DateRangePicker"

import type { TenantKpis, TimeSeriesPoint } from "@/api/apiService"

interface AnalyticsDashboardProps {
  initialKpis?: TenantKpis[]
  initialTimeSeries?: TimeSeriesPoint[]
  tenantId?: string
}

export const AnalyticsDashboard = ({ initialKpis, initialTimeSeries, tenantId: tenantIdProp }: AnalyticsDashboardProps = {}) => {
  const [, setDateRange] = useState<DateRange | undefined>()
  const user = useAuthStore((s) => s.user)
  const tenantId = tenantIdProp ?? user?.tenant_id ?? undefined

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["analyticsKpis", tenantId],
    queryFn: () => getAnalyticsKpis(tenantId),
    initialData: initialKpis ? (tenantId ? initialKpis.find(k => k.tenant_id === tenantId) : undefined) : undefined,
    refetchInterval: 10_000,
  })

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ["analyticsTimeSeries", tenantId],
    queryFn: () => getAnalyticsTimeSeries("conversations", "7d", tenantId),
    initialData: initialTimeSeries?.map(p => ({ date: p.date, value: p.total_conversations })),
    refetchInterval: 10_000,
  })

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi ${getDisplayName(user)}, here's your platform today`}
        description={today}
        actions={<DateRangePicker onDateChange={setDateRange} />}
      />

      {kpisLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Conversations"
            value={(kpis?.total_conversations ?? 0).toLocaleString()}
            description={
              tenantId ? "last 7 days · this tenant" : "last 7 days · all tenants"
            }
            icon={MessagesSquare}
          />
          <KpiCard
            title="User Messages"
            value={(kpis?.messages_user ?? 0).toLocaleString()}
            description="received from end users"
            icon={MessageCircle}
          />
          <KpiCard
            title="Resolution Rate"
            value={`${(kpis?.resolution_rate_percent ?? 0).toFixed(1)}%`}
            description="conversations closed successfully"
            icon={CheckCircle2}
          />
          <KpiCard
            title="Average CSAT"
            value={`${(kpis?.average_csat ?? 0).toFixed(2)} / 5`}
            description="average rating by users"
            icon={Star}
          />
        </div>
      )}

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Conversation Volume</CardTitle>
            <CardDescription>Daily conversations over the last 7 days</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pl-2">
          {timeSeriesLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : (
            <ConversationsChart data={timeSeries || []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
