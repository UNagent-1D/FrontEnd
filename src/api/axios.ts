import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const TENANT_URL = import.meta.env.VITE_TENANT_API_URL || 'http://localhost:8080';
const CHAT_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8082/api/v1';

function attachInterceptors(instance: ReturnType<typeof axios.create>) {
  // Request: inject Bearer token + cross-tenant guard
  instance.interceptors.request.use(
    (config) => {
      const { token, user } = useAuthStore.getState();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (config.url && user && user.role !== 'app_admin') {
        const match = config.url.match(/\/tenants\/([^/]+)/);
        if (match && match[1] && match[1] !== user.tenant_id) {
          return Promise.reject(new Error('Cross-tenant access violation blocked by client.'));
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response: handle 401 logout + 500 request_id logging
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 500) {
        const requestId = error.response.data?.request_id || error.response.headers['x-request-id'];
        if (requestId) console.error(`[Fatal Error] Request ID: ${requestId}`);
      }
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
      }
      return Promise.reject(error);
    }
  );
}

// Tenant service (port 8080) — auth, tenants, users
export const tenantClient = axios.create({
  baseURL: TENANT_URL,
  headers: { 'Content-Type': 'application/json' },
});
attachInterceptors(tenantClient);

// Conversation-chat service (port 8082) — sessions, history, operator actions
export const chatClient = axios.create({
  baseURL: CHAT_URL,
  headers: { 'Content-Type': 'application/json' },
});
attachInterceptors(chatClient);

// Backward-compat alias used by non-connected features (profiles, datasources, etc.)
export const apiClient = tenantClient;
