'use client'

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  Bot,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { KpiCard } from "./KpiCard"
import { ConversationsChart } from "./ConversationsChart"

import type { TenantKpis, TimeSeriesPoint } from "@/api/apiService"

interface AnalyticsDashboardProps {
  initialKpis?: TenantKpis[]
  initialTimeSeries?: TimeSeriesPoint[]
  tenantId?: string
}

type RangeKey = "7d" | "30d" | "90d"

const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
}
// Days mapping lives in apiService.ts::DAYS_BY_RANGE; we pass the key
// through as the `range` arg to getAnalyticsTimeSeries.

// Calculation explainers shown on hover of the info icon next to each KPI.
const KPI_TOOLTIPS = {
  total: "Total chat sessions opened (Telegram + web). One per /start or first dashboard open.",
  userMsgs: "Messages sent by end users to the bot, summed across the full history.",
  botMsgs: "Messages produced by the AI assistant. Does not include human operator messages.",
  resolution: "Share of conversations that ended with a successful booking. Calculated as (appointments_booked / conversations) × 100.",
  avgPerConv: "Average messages (user + bot) per conversation. Efficiency signal — fewer messages to book = more effective bot.",
  csat: "Average user rating left at the end of the conversation, 1 to 5. Only counts conversations where the user provided feedback.",
} as const

export const AnalyticsDashboard = ({ initialKpis, initialTimeSeries, tenantId: tenantIdProp }: AnalyticsDashboardProps = {}) => {
  const [range, setRange] = useState<RangeKey>("7d")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const user = useAuthStore((s) => s.user)
  const tenantId = tenantIdProp ?? user?.tenant_id ?? undefined

  const { data: kpis, isLoading: kpisLoading, dataUpdatedAt } = useQuery({
    queryKey: ["analyticsKpis", tenantId],
    queryFn: () => getAnalyticsKpis(tenantId),
    initialData: initialKpis ? (tenantId ? initialKpis.find(k => k.tenant_id === tenantId) : undefined) : undefined,
    refetchInterval: 10_000,
  })

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ["analyticsTimeSeries", tenantId, range],
    queryFn: () => getAnalyticsTimeSeries("conversations", range, tenantId),
    initialData: initialTimeSeries?.map(p => ({ date: p.date, value: p.total_conversations })),
    refetchInterval: 10_000,
  })

  useEffect(() => {
    if (dataUpdatedAt) setLastUpdated(new Date(dataUpdatedAt))
  }, [dataUpdatedAt])

  const todayShort = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi ${getDisplayName(user)}, here's how the platform is doing today`}
        description={todayShort}
        actions={
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => (
                <SelectItem key={key} value={key}>{RANGE_LABEL[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {kpisLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Total conversations"
            value={(kpis?.total_conversations ?? 0).toLocaleString()}
            description={tenantId ? "all time · this tenant" : "all time · all tenants"}
            icon={MessagesSquare}
            tooltip={KPI_TOOLTIPS.total}
          />
          <KpiCard
            title="User messages"
            value={(kpis?.messages_user ?? 0).toLocaleString()}
            description="received from end users"
            icon={MessageCircle}
            tooltip={KPI_TOOLTIPS.userMsgs}
          />
          <KpiCard
            title="Bot messages"
            value={(kpis?.messages_bot ?? 0).toLocaleString()}
            description="produced by the assistant"
            icon={Bot}
            tooltip={KPI_TOOLTIPS.botMsgs}
          />
          <KpiCard
            title="Resolution rate"
            value={`${(kpis?.resolution_rate_percent ?? 0).toFixed(1)}%`}
            description="conversations with a booking"
            icon={CheckCircle2}
            tooltip={KPI_TOOLTIPS.resolution}
          />
          <KpiCard
            title="Messages per conversation"
            value={(kpis?.avg_messages_per_conv ?? 0).toFixed(1)}
            description="average (user + bot)"
            icon={Activity}
            tooltip={KPI_TOOLTIPS.avgPerConv}
          />
          <KpiCard
            title="Average CSAT"
            value={`${(kpis?.average_csat ?? 0).toFixed(2)} / 5`}
            description="average user rating"
            icon={Star}
            tooltip={KPI_TOOLTIPS.csat}
          />
        </div>
      )}

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Conversation volume</CardTitle>
            <CardDescription>Daily conversations · {RANGE_LABEL[range].toLowerCase()}</CardDescription>
          </div>
          {lastUpdated ? (
            <span className="text-xs text-muted-foreground">
              Updated at {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
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
