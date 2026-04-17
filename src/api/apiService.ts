import { tenantClient, chatClient } from './axios';
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
// ANALYTICS  →  not yet available — mocked
// ==================================================================

export const getAnalyticsKpis = async (_tenantId?: string) => {
  return {
    totalConversations: 1250,
    escalationRate: 0.12,
    avgResolutionTime: 180,
    mostUsedTool: 'list_doctors',
  };
};

export const getAnalyticsTimeSeries = async (_metric: string, _range: string, _tenantId?: string) => {
  return [
    { date: '2026-03-01', value: 30 },
    { date: '2026-03-02', value: 45 },
    { date: '2026-03-03', value: 40 },
    { date: '2026-03-04', value: 55 },
    { date: '2026-03-05', value: 60 },
    { date: '2026-03-06', value: 75 },
    { date: '2026-03-07', value: 70 },
  ];
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
