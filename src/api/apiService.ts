import { tenantClient, chatClient, metricasClient, orchClient } from './axios';
import type {
  DataSource, User, Tenant, CreateUserRequest, SessionInfo, SessionHistory,
  UserResponse, BackendAgentProfile, BackendTool, BackendAgentConfig,
} from '@/types';

// ==================================================================
// AUTHENTICATION  →  Tenant service (port 8080)
// ==================================================================

export const getMe = async (): Promise<UserResponse> => {
  const { data } = await tenantClient.get<UserResponse>('/api/v1/auth/me');
  return data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await tenantClient.patch('/api/v1/auth/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
};

export const login = async (credentials: Record<string, unknown>): Promise<{ token: string; user: User }> => {
  const { data } = await tenantClient.post('/api/v1/auth/login', credentials);
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
  const { data } = await tenantClient.get<{ data: Tenant[] }>('/api/v1/tenants');
  return data.data;
};

export const getTenant = async (tenantId: string): Promise<Tenant | null> => {
  try {
    const { data } = await tenantClient.get<Tenant>(`/api/v1/tenants/${tenantId}`);
    return data;
  } catch {
    return null;
  }
};

export type CreateTenantPayload = {
  slug: string;
  name: string;
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
};

export const createTenant = async (payload: CreateTenantPayload): Promise<Tenant> => {
  // Backend lives at /api/v1/tenants (the /api/admin/* prefix is legacy).
  const body: CreateTenantPayload = {
    slug: payload.slug.trim(),
    name: payload.name.trim(),
    plan: payload.plan ?? 'free',
  };
  const { data } = await tenantClient.post<Tenant>('/api/v1/tenants', body);
  return data;
};

export const updateTenant = async (
  tenantId: string,
  payload: { name?: string; plan?: string; status?: 'active' | 'suspended' | 'churned' },
): Promise<Tenant> => {
  const { data } = await tenantClient.patch<Tenant>(`/api/v1/tenants/${tenantId}`, payload);
  return data;
};

// ==================================================================
// USER MANAGEMENT  →  Tenant service (port 8080)
// ==================================================================

export const createUser = async (req: CreateUserRequest): Promise<UserResponse> => {
  const { data } = await tenantClient.post<UserResponse>('/api/v1/users', req);
  return data;
};

export const listUsers = async (): Promise<UserResponse[]> => {
  const { data } = await tenantClient.get<{ data: UserResponse[] }>('/api/v1/users');
  return data.data;
};

export const getUser = async (uid: string): Promise<UserResponse> => {
  const { data } = await tenantClient.get<UserResponse>(`/api/v1/users/${uid}`);
  return data;
};

export const updateUser = async (uid: string, payload: { role?: string; is_active?: boolean }): Promise<UserResponse> => {
  const { data } = await tenantClient.patch<UserResponse>(`/api/v1/users/${uid}`, payload);
  return data;
};

export const deleteUser = async (uid: string): Promise<void> => {
  await tenantClient.delete(`/api/v1/users/${uid}`);
};

// ==================================================================
// AGENT PROFILES  →  Tenant service (port 8080)
// ==================================================================

export const getAgentProfiles = async (tenantId: string): Promise<BackendAgentProfile[]> => {
  const { data } = await tenantClient.get<{ data: BackendAgentProfile[] }>(`/api/v1/tenants/${tenantId}/profiles`);
  return data.data;
};

export const createAgentProfile = async (
  tenantId: string,
  payload: { name: string; description?: string; allowed_specialties?: string[]; allowed_locations?: string[] },
): Promise<BackendAgentProfile> => {
  const { data } = await tenantClient.post<BackendAgentProfile>(`/api/v1/tenants/${tenantId}/profiles`, payload);
  return data;
};

export const updateAgentProfile = async (
  tenantId: string,
  profileId: string,
  payload: { name?: string; description?: string; allowed_specialties?: string[]; allowed_locations?: string[] },
): Promise<BackendAgentProfile> => {
  const { data } = await tenantClient.patch<BackendAgentProfile>(`/api/v1/tenants/${tenantId}/profiles/${profileId}`, payload);
  return data;
};

// ==================================================================
// DATA SOURCES  →  Tenant service (port 8080)
// ==================================================================

export const getDataSources = async (tenantId: string): Promise<DataSource[]> => {
  const { data } = await tenantClient.get<{ data: DataSource[] }>(`/api/v1/tenants/${tenantId}/data-sources`);
  return data.data;
};

export const createDataSource = async (
  tenantId: string,
  payload: { name: string; source_type: string; base_url: string; route_configs: Record<string, { method: string; path: string }> },
): Promise<DataSource> => {
  const { data } = await tenantClient.post<DataSource>(`/api/v1/tenants/${tenantId}/data-sources`, payload);
  return data;
};

export const updateDataSource = async (
  tenantId: string,
  id: string,
  payload: { route_configs: Record<string, { method: string; path: string }> },
): Promise<DataSource> => {
  const { data } = await tenantClient.patch<DataSource>(`/api/v1/tenants/${tenantId}/data-sources/${id}`, payload);
  return data;
};

// ==================================================================
// TOOL REGISTRY  →  Tenant service (port 8080)
// ==================================================================

export const getToolRegistry = async (): Promise<BackendTool[]> => {
  const { data } = await tenantClient.get<{ data: BackendTool[] }>('/api/v1/tool-registry');
  return data.data;
};

// ==================================================================
// AGENT CONFIG REGISTRY (ACR)  →  Tenant service (port 8080)
// ==================================================================

export const getAgentConfigs = async (tenantId: string, profileId: string): Promise<BackendAgentConfig[]> => {
  const { data } = await tenantClient.get<{ data: BackendAgentConfig[] }>(
    `/api/v1/tenants/${tenantId}/profiles/${profileId}/configs`,
  );
  return data.data;
};

export const getActiveAgentConfig = async (tenantId: string, profileId: string): Promise<BackendAgentConfig | null> => {
  try {
    const { data } = await tenantClient.get<BackendAgentConfig>(
      `/api/v1/tenants/${tenantId}/profiles/${profileId}/configs/active`,
    );
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
};

export interface CreateAgentConfigPayload {
  conversation_policy: any;
  escalation_rules: any;
  tool_permissions: Array<{ tool_name: string; constraints?: Record<string, any> }>;
  llm_params: { model: string; temperature: number; max_tokens: number; system_prompt: string };
  channel_format_rules?: any;
}

export const createAgentConfig = async (
  tenantId: string,
  profileId: string,
  payload: CreateAgentConfigPayload,
): Promise<BackendAgentConfig> => {
  const { data } = await tenantClient.post<BackendAgentConfig>(
    `/api/v1/tenants/${tenantId}/profiles/${profileId}/configs`,
    payload,
  );
  return data;
};

export const updateAgentConfig = async (
  tenantId: string,
  profileId: string,
  configId: string,
  payload: Partial<CreateAgentConfigPayload>,
): Promise<BackendAgentConfig> => {
  const { data } = await tenantClient.patch<BackendAgentConfig>(
    `/api/v1/tenants/${tenantId}/profiles/${profileId}/configs/${configId}`,
    payload,
  );
  return data;
};

export const activateAgentConfig = async (
  tenantId: string,
  profileId: string,
  configId: string,
): Promise<BackendAgentConfig> => {
  const { data } = await tenantClient.post<BackendAgentConfig>(
    `/api/v1/tenants/${tenantId}/profiles/${profileId}/configs/${configId}/activate`,
  );
  return data;
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
