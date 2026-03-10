import { useState } from "react";
import { KpiCard } from "./KpiCard";
import { ConversationsChart } from "./ConversationsChart";
import { DateRangePicker } from "./DateRangePicker";
import { getAnalyticsKpis, getAnalyticsTimeSeries } from "@/api/apiService";
import { useQuery } from "@tanstack/react-query";
import { type DateRange } from "react-day-picker";

export const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // In a real app, you would pass the dateRange to the query
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['analyticsKpis'],
    queryFn: () => getAnalyticsKpis(),
  });

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['analyticsTimeSeries'],
    queryFn: () => getAnalyticsTimeSeries('conversations', '30d'),
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Total de Conversaciones"
          value={kpis?.totalConversations.toLocaleString() || '0'}
          description="en el período seleccionado"
        />
        <KpiCard 
          title="Tasa de Escalación"
          value={`${(kpis?.escalationRate || 0) * 100}%`}
          change={-0.02} // Example change
          changeType="decrease" // Lower is better
          description="Conversaciones escaladas a un humano"
        />
        <KpiCard 
          title="Tiempo de Resolución"
          value={`${Math.round((kpis?.avgResolutionTime || 0) / 60)}m ${ (kpis?.avgResolutionTime || 0) % 60}s`}
          description="Tiempo promedio por bot"
        />
        <KpiCard 
          title="Herramienta Más Usada"
          value={kpis?.mostUsedTool || 'N/A'}
          description="Operación más frecuente del agente"
        />
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1">
        <ConversationsChart data={timeSeries || []} />
      </div>
    </div>
  );
};
