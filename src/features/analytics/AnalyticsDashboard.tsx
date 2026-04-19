import { useState } from "react";
import { KpiCard } from "./KpiCard";
import { ConversationsChart } from "./ConversationsChart";
import { DateRangePicker } from "./DateRangePicker";
import { getAnalyticsKpis, getAnalyticsTimeSeries } from "@/api/apiService";
import { useQuery } from "@tanstack/react-query";
import { type DateRange } from "react-day-picker";
import { useAuthStore } from "@/store/authStore";

export const AnalyticsDashboard = () => {
  const [, setDateRange] = useState<DateRange | undefined>();
  const tenantId = useAuthStore((s) => s.user?.tenant_id) || undefined;

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['analyticsKpis', tenantId],
    queryFn: () => getAnalyticsKpis(tenantId),
    refetchInterval: 10_000,
  });

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['analyticsTimeSeries', tenantId],
    queryFn: () => getAnalyticsTimeSeries('conversations', '7d', tenantId),
    refetchInterval: 10_000,
  });

  if (kpisLoading || timeSeriesLoading) {
    return <div>Cargando métricas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
          <p className="text-muted-foreground">
            Resumen del rendimiento de la plataforma y los agentes.
          </p>
        </div>
        <DateRangePicker onDateChange={setDateRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de Conversaciones"
          value={(kpis?.total_conversations ?? 0).toLocaleString()}
          description={tenantId ? "de este tenant" : "agregadas entre tenants"}
        />
        <KpiCard
          title="Mensajes de Usuario"
          value={(kpis?.messages_user ?? 0).toLocaleString()}
          description="recibidos desde usuarios"
        />
        <KpiCard
          title="Tasa de Resolución"
          value={`${(kpis?.resolution_rate_percent ?? 0).toFixed(1)}%`}
          description="Conversaciones cerradas satisfactoriamente"
        />
        <KpiCard
          title="CSAT Promedio"
          value={`${(kpis?.average_csat ?? 0).toFixed(2)} / 5`}
          description="Valoración promedio por los usuarios"
        />
      </div>

      <div className="grid grid-cols-1">
        <ConversationsChart data={timeSeries || []} />
      </div>
    </div>
  );
};
