import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

const roleRedirectMap: Record<Role, string> = {
  app_admin: '/admin/tenants',
  tenant_admin: '/dashboard/profiles',
  tenant_operator: '/dashboard/analytics',
};

export const RootRedirect = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={roleRedirectMap[user.role] ?? '/login'} replace />;
};
