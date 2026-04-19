import { tenantClient, chatClient, metricasClient, orchClient } from './axios';
import type {
  AgentProfile, DataSource, Tool, AgentConfig, User,
  Tenant, CreateUserRequest, SessionInfo, SessionHistory,
} from '@/types';

// ==================================================================
// AUTHENTICATION  →  Tenant service (port 8080)
// ==================================================================

export const login = async (credentials: Record<string, unknown>): Promise<{ token: string; user: User }> => {
  const { data } = await tenantClient.post('/auth/login', credentials);
  const base64 = data.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(base64));
  const user: User = {
    id: payload.user_id,
    email: payload.email,
    role: payload.role,
    tenant_id: payload.tenant_id ?? '',
  };
  return { token: data.token, user };
};

// ==================================================================
// TENANT MANAGEMENT  →  Tenant service (port 8080)  — app_admin only
// ==================================================================

export const listTenants = async (): Promise<Tenant[]> => {
  const { data } = await tenantClient.get<Tenant[]>('/api/admin/tenants');
  return data;
};

export const getTenant = async (tenantId: string): Promise<Tenant | null> => {
  const tenants = await listTenants();
  return tenants.find((t) => t.id === tenantId) ?? null;
};

export const createTenant = async (name: string, domain?: string): Promise<Tenant> => {
  const { data } = await tenantClient.post<{ message: string; tenant: Tenant }>(
    '/api/admin/tenants',
    { name, domain },
  );
  return data.tenant;
};

// ==================================================================
// USER MANAGEMENT  →  Tenant service (port 8080)
// ==================================================================

export const createUser = async (req: CreateUserRequest): Promise<{ user_id: string }> => {
  const { data } = await tenantClient.post<{ message: string; user_id: string }>('/api/users/', req);
  return data;
};

// ==================================================================
// AGENT PROFILES  →  ACR service (not yet available — mocked)
// ==================================================================

export const getAgentProfiles = async (): Promise<AgentProfile[]> => {
  return [];
};

export const updateAgentProfile = async (_profileId: string, _profileData: Partial<AgentProfile>) => {
  return null;
};

// ==================================================================
// DATA SOURCES  →  ACR service (not yet available — mocked)
// ==================================================================

export const getDataSources = async (): Promise<DataSource[]> => {
  return [];
};

export const updateDataSource = async (_id: string, _dataSourceData: DataSource) => {
  return null;
};

// ==================================================================
// AGENT CONFIG REGISTRY (ACR)  →  not yet available — mocked
// ==================================================================

export const getToolRegistry = async (): Promise<Tool[]> => {
  return [];
};

export const getAgentConfigs = async (_profileId: string): Promise<AgentConfig[]> => {
  return [];
};

export const getActiveAgentConfig = async (_profileId: string): Promise<AgentConfig | null> => {
  return null;
};

export const updateAgentConfig = async (_configId: string, _configData: AgentConfig) => {
  return null;
};

export const activateAgentConfig = async (_configId: string) => {
  return null;
};

// ==================================================================
// ANALYTICS  →  Metricas service (port 8091) — /stats/kpis
// ==================================================================

export type TenantKpis = {
  tenant_id: string;
  total_conversations: number;
  messages_user: number;
  messages_bot: number;
  average_csat: number;
  avg_messages_per_conv: number;
  resolution_rate_percent: number;
};

const emptyKpis = (tenantId: string): TenantKpis => ({
  tenant_id: tenantId,
  total_conversations: 0,
  messages_user: 0,
  messages_bot: 0,
  average_csat: 0,
  avg_messages_per_conv: 0,
  resolution_rate_percent: 0,
});

const aggregateKpis = (acc: TenantKpis, row: TenantKpis): TenantKpis => {
  const nextTotal = acc.total_conversations + row.total_conversations;
  return {
    tenant_id: 'all',
    total_conversations: nextTotal,
    messages_user: acc.messages_user + row.messages_user,
    messages_bot: acc.messages_bot + row.messages_bot,
    average_csat: nextTotal
      ? (acc.average_csat * acc.total_conversations + row.average_csat * row.total_conversations) / nextTotal
      : 0,
    avg_messages_per_conv: nextTotal
      ? (acc.messages_user + acc.messages_bot + row.messages_user + row.messages_bot) / nextTotal
      : 0,
    resolution_rate_percent: nextTotal
      ? (acc.resolution_rate_percent * acc.total_conversations + row.resolution_rate_percent * row.total_conversations) / nextTotal
      : 0,
  };
};

export const getAnalyticsKpis = async (tenantId?: string): Promise<TenantKpis> => {
  try {
    const { data } = await metricasClient.get<{ data: TenantKpis[] | null }>('/stats/kpis');
    const rows = data.data ?? [];
    if (tenantId) {
      return rows.find((r) => r.tenant_id === tenantId) ?? emptyKpis(tenantId);
    }
    return rows.reduce(aggregateKpis, emptyKpis('all'));
  } catch {
    return emptyKpis(tenantId ?? 'all');
  }
};

export type TimeSeriesPoint = {
  date: string;
  total_conversations: number;
  messages_user: number;
  messages_bot: number;
  successful_chats: number;
  avg_csat: number;
};

export const getAnalyticsTimeSeriesRaw = async (
  tenantId?: string,
  days = 7,
): Promise<TimeSeriesPoint[]> => {
  try {
    const { data } = await metricasClient.get<{ data: TimeSeriesPoint[] | null }>(
      '/stats/timeseries',
      { params: { tenant_id: tenantId, days } },
    );
    return data.data ?? [];
  } catch {
    return [];
  }
};

export const getAnalyticsTimeSeries = async (
  _metric: string,
  _range: string,
  tenantId?: string,
): Promise<{ date: string; value: number }[]> => {
  try {
    const { data } = await metricasClient.get<{ data: TimeSeriesPoint[] | null }>(
      '/stats/timeseries',
      { params: { tenant_id: tenantId, days: 7 } },
    );
    return (data.data ?? []).map((p) => ({ date: p.date, value: p.total_conversations }));
  } catch {
    return [];
  }
};

// ==================================================================
// SESSIONS  →  conversation-chat service (port 8082)
// ==================================================================

export const getSession = async (sessionId: string): Promise<SessionInfo> => {
  const { data } = await chatClient.get<SessionInfo>(`/sessions/${sessionId}`);
  return data;
};

export const getSessionHistory = async (sessionId: string): Promise<SessionHistory> => {
  const { data } = await chatClient.get<SessionHistory>(`/sessions/${sessionId}/history`);
  return data;
};

export const acceptEscalation = async (sessionId: string) => {
  const { data } = await chatClient.post(`/sessions/${sessionId}/operator-accept`);
  return data;
};

export const resolveEscalation = async (sessionId: string, action: 'close' | 'bot_resume') => {
  const { data } = await chatClient.post(`/sessions/${sessionId}/operator-resolve`, { resolve_action: action });
  return data;
};

// ==================================================================
// ORCH  →  chat-orch (port 8000) — user-facing chat entry + SSE
// ==================================================================

export type OrchChatResponse = {
  session_id: string;
  message?: { text?: string };
  action?: string;
  [key: string]: unknown;
};

export const postChatMessage = async (
  tenantId: string,
  message: string,
  sessionId?: string,
): Promise<OrchChatResponse> => {
  const { data } = await orchClient.post<OrchChatResponse>('/v1/chat', {
    tenant_id: tenantId,
    session_id: sessionId,
    message,
  });
  return data;
};

export const submitCsat = async (tenantId: string, score: 1 | 2 | 3 | 4 | 5, sessionId?: string) => {
  const { data } = await orchClient.post<{ status: string }>('/v1/feedback', {
    tenant_id: tenantId,
    session_id: sessionId,
    score,
  });
  return data;
};
