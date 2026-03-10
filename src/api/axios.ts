import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const authState = useAuthStore.getState();
    const token = authState.token;
    const user = authState.user;

    // Inject Token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Proactive Audit: Block requests to /tenants/:id if ID doesn't match the current user's tenant
    // App admins are exempt from this restriction as they have global access
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

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 500 Internal Server Error and extract request_id
    if (error.response && error.response.status === 500) {
      const requestId = error.response.data?.request_id || error.response.headers['x-request-id'];
      if (requestId) {
        console.error(`[Fatal Error] Request ID: ${requestId}`);
        // Future: Trigger a toast notification system here using Shadcn
      }
    }
    
    // Check for 401 Unauthorized to trigger logout
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().clearAuth();
      // The router's RoleGuard will automatically redirect to login when state becomes null
    }

    return Promise.reject(error);
  }
);
