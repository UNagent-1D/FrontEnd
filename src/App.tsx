import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { RootRedirect } from '@/components/layout/RootRedirect';

const Login              = lazy(() => import('@/features/auth/Login').then(m => ({ default: m.Login })));
const GlobalTenants      = lazy(() => import('@/features/tenants/GlobalTenants').then(m => ({ default: m.GlobalTenants })));
const DashboardProfiles  = lazy(() => import('@/features/profiles/DashboardProfiles').then(m => ({ default: m.DashboardProfiles })));
const OperatorLookup     = lazy(() => import('@/features/lookup/OperatorLookup').then(m => ({ default: m.OperatorLookup })));
const AgentConsole       = lazy(() => import('@/features/console/AgentConsole').then(m => ({ default: m.AgentConsole })));
const OperatorDashboard  = lazy(() => import('@/features/operator/OperatorDashboard').then(m => ({ default: m.OperatorDashboard })));
const DataSourcesManager = lazy(() => import('@/features/datasources/DataSourcesManager').then(m => ({ default: m.DataSourcesManager })));
const AnalyticsDashboard = lazy(() => import('@/features/analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));

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
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
