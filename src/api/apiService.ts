import { apiClient } from './axios';
import type { AgentProfile, Session, DataSource, Tool, AgentConfig } from '@/types';

/**
 * ==================================================================
 * AUTHENTICATION SERVICE
 * ==================================================================
 */

export const login = async (credentials: Record<string, unknown>) => {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data; // Expected to return { token, user }
};

/**
 * ==================================================================
 * TENANT SERVICE
 * ==================================================================
 */

export const getTenant = async (tenantId: string) => {
  const { data } = await apiClient.get(`/tenants/${tenantId}`);
  return data; // Expected to return Tenant object
};

/**
 * ==================================================================
 * AGENT PROFILES SERVICE
 * ==================================================================
 */

export const getAgentProfiles = async () => {
  const { data } = await apiClient.get(`/profiles`);
  return data as AgentProfile[];
};

export const updateAgentProfile = async (profileId: string, profileData: Partial<AgentProfile>) => {
  const { data } = await apiClient.patch(`/profiles/${profileId}`, profileData);
  return data;
};

/**
 * ==================================================================
 * DATA SOURCES SERVICE
 * ==================================================================
 */
export const getDataSources = async () => {
  const { data } = await apiClient.get<DataSource[]>(`/data-sources`);
  return data;
};

export const updateDataSource = async (id: string, dataSourceData: DataSource) => {
  const { data } = await apiClient.patch<DataSource>(`/data-sources/${id}`, dataSourceData);
  return data;
};

/**
 * ==================================================================
 * AGENT CONFIG REGISTRY (ACR) SERVICE
 * ==================================================================
 */

export const getToolRegistry = async () => {
  const { data } = await apiClient.get<Tool[]>('/tool-registry');
  return data;
};

export const getAgentConfigs = async (profileId: string) => {
  const { data } = await apiClient.get<AgentConfig[]>(`/profiles/${profileId}/configs`);
  return data;
};

export const getActiveAgentConfig = async (profileId: string) => {
  const { data } = await apiClient.get<AgentConfig>(`/profiles/${profileId}/configs/active`);
  return data;
}

export const updateAgentConfig = async (configId: string, configData: AgentConfig) => {
  const { data } = await apiClient.patch<AgentConfig>(`/configs/${configId}`, configData);
  return data;
}

export const activateAgentConfig = async (configId: string) => {
  const { data } = await apiClient.post(`/configs/${configId}/activate`);
  return data;
};


/**
 * ==================================================================
 * ANALYTICS SERVICE
 * ==================================================================
 */

// Placeholder for fetching main KPIs
export const getAnalyticsKpis = async (tenantId?: string) => {
  console.log('Fetching KPIs for tenant:', tenantId);
  // In a real app: const { data } = await apiClient.get(`/analytics/kpis`, { params: { tenant_id: tenantId } });
  return {
    totalConversations: 1250,
    escalationRate: 0.12, // 12%
    avgResolutionTime: 180, // in seconds
    mostUsedTool: 'list_doctors',
  };
};

// Placeholder for fetching time-series data
export const getAnalyticsTimeSeries = async (metric: string, range: string, tenantId?: string) => {
  console.log(`Fetching metric ${metric} for range ${range} and tenant ${tenantId}`);
  // In a real app: const { data } = await apiClient.get(`/analytics/timeseries`, { params: { metric, range, tenant_id: tenantId } });
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


/**
 * ==================================================================
 * OPERATOR & CONVERSATION SERVICE
 * ==================================================================
 */

export const getSessionHistory = async (sessionId: string) => {
  const { data } = await apiClient.get<Session>(`/sessions/${sessionId}/history`);
  return data;
};

export const acceptEscalation = async (sessionId: string) => {
  const { data } = await apiClient.post(`/sessions/${sessionId}/operator-accept`);
  return data;
};

export const resolveEscalation = async (sessionId: string, action: 'close' | 'bot_resume') => {
  const { data } = await apiClient.post(`/sessions/${sessionId}/operator-resolve`, { resolve_action: action });
  return data;
};
