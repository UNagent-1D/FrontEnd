import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Login } from '@/features/auth/Login';
import { GlobalTenants } from '@/features/tenants/GlobalTenants';
import { DashboardProfiles } from '@/features/profiles/DashboardProfiles';
import { OperatorLookup } from '@/features/lookup/OperatorLookup';
import { AgentConsole } from '@/features/console/AgentConsole';
import { OperatorDashboard } from '@/features/operator/OperatorDashboard';
import { DataSourcesManager } from '@/features/datasources/DataSourcesManager';
import { RootRedirect } from '@/components/layout/RootRedirect';
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard';

const Unauthorized = () => <div className="p-8 text-destructive font-bold">403 - Acceso No Autorizado</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Global Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['app_admin']} redirectTo="/dashboard/profiles" />}>
          <Route path="/admin/tenants" element={<DashboardLayout><GlobalTenants /></DashboardLayout>} />
        </Route>

        {/* Tenant Admin & App Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['app_admin', 'tenant_admin']} />}>
          <Route path="/dashboard/analytics" element={<DashboardLayout><AnalyticsDashboard /></DashboardLayout>} />
          <Route path="/dashboard/profiles" element={<DashboardLayout><DashboardProfiles /></DashboardLayout>} />
          <Route path="/dashboard/datasources" element={<DashboardLayout><DataSourcesManager /></DashboardLayout>} />
          <Route path="/console" element={<DashboardLayout><AgentConsole /></DashboardLayout>} />
        </Route>

        {/* Operator, Tenant Admin & App Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['app_admin', 'tenant_admin', 'tenant_operator']} />}>
          <Route path="/operator/dashboard" element={<DashboardLayout><OperatorDashboard /></DashboardLayout>} />
          <Route path="/operator/lookup" element={<DashboardLayout><OperatorLookup /></DashboardLayout>} />
        </Route>

        {/* Default fallback: Use the smart redirect component */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
