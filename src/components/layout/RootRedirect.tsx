import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

const roleRedirectMap: Record<Role, string> = {
  app_admin: '/admin/tenants',
  tenant_admin: '/dashboard/profiles',
  tenant_operator: '/operator/dashboard',
};

export const RootRedirect = () => {
  // --- CORRECTION START ---
  // Select primitive values directly from the store. This is more stable
  // and prevents the infinite re-render loop.
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  // --- CORRECTION END ---

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const redirectTo = roleRedirectMap[user.role] || '/login';

  return <Navigate to={redirectTo} replace />;
};
