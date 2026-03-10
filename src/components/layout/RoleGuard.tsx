import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

interface RoleGuardProps {
  allowedRoles: Role[];
  redirectTo?: string;
}

export const RoleGuard = ({ allowedRoles, redirectTo = '/unauthorized' }: RoleGuardProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated() || !user) {
    // If not logged in, always redirect to login
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If logged in but lacks required role
    return <Navigate to={redirectTo} replace />;
  }

  // Authorized: render child routes
  return <Outlet />;
};
