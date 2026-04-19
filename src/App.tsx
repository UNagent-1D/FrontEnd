import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Login } from '@/features/auth/Login';
import { GlobalTenants } from '@/features/tenants/GlobalTenants';
import { DashboardProfiles } from '@/features/profiles/DashboardProfiles';
import { OperatorLookup } from '@/features/lookup/OperatorLookup';
import { AgentConsole } from '@/features/console/AgentConsole';
import { OperatorDashboard } from '@/features/operator/OperatorDashboard';
import { DataSourcesManager } from '@/features/datasources/DataSourcesManager';
import { RootRedirect } from '@/components/layout/RootRedirect';
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard';

const Unauthorized = () => (
  <div className="flex min-h-screen items-center justify-center p-8">
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-destructive">403</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You don't have permission to view this page.
      </p>
    </div>
  </div>
);

const protectedRoute = (children: React.ReactNode) => (
  <DashboardLayout>
    <ErrorBoundary>{children}</ErrorBoundary>
  </DashboardLayout>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Global Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['app_admin']} redirectTo="/dashboard/profiles" />}>
          <Route path="/admin/tenants" element={protectedRoute(<GlobalTenants />)} />
        </Route>

        {/* Tenant Admin & App Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['app_admin', 'tenant_admin']} />}>
          <Route path="/dashboard/analytics" element={protectedRoute(<AnalyticsDashboard />)} />
          <Route path="/dashboard/profiles" element={protectedRoute(<DashboardProfiles />)} />
          <Route path="/dashboard/datasources" element={protectedRoute(<DataSourcesManager />)} />
          <Route path="/console" element={protectedRoute(<AgentConsole />)} />
        </Route>

        {/* Operator, Tenant Admin & App Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['app_admin', 'tenant_admin', 'tenant_operator']} />}>
          <Route path="/operator/dashboard" element={protectedRoute(<OperatorDashboard />)} />
          <Route path="/operator/lookup" element={protectedRoute(<OperatorLookup />)} />
        </Route>

        {/* Default fallback: Use the smart redirect component */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
