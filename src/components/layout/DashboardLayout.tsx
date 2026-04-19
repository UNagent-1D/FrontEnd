import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { useTenantStore } from "@/store/tenantStore"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Search,
  LogOut,
  Menu,
  MessageCircle,
  ShieldCheck,
  Database,
  BarChart2,
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, clearAuth } = useAuthStore()
  const { currentTenant, clearTenant } = useTenantStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    clearTenant()
    navigate("/login")
  }

  const navItems = [
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart2,
      roles: ["app_admin", "tenant_admin"],
    },
    {
      title: "Agent Profiles",
      href: "/dashboard/profiles",
      icon: LayoutDashboard,
      roles: ["app_admin", "tenant_admin"],
    },
    {
      title: "Data Sources",
      href: "/dashboard/datasources",
      icon: Database,
      roles: ["app_admin", "tenant_admin"],
    },
    {
      title: "Agent Console",
      href: "/console",
      icon: MessageCircle,
      roles: ["app_admin", "tenant_admin"],
    },
    {
      title: "Operator Panel",
      href: "/operator/dashboard",
      icon: ShieldCheck,
      roles: ["app_admin", "tenant_admin", "tenant_operator"],
    },
    {
      title: "Customer Lookup",
      href: "/operator/lookup",
      icon: Search,
      roles: ["tenant_admin", "tenant_operator"],
    },
    {
      title: "Global Tenants",
      href: "/admin/tenants",
      icon: Users,
      roles: ["app_admin"],
    },
  ]

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || "")
  )

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            {currentTenant?.branding_logo_url ? (
              <img
                src={currentTenant.branding_logo_url}
                alt={`Logo de ${currentTenant.name}`}
                className="h-8 w-auto object-contain max-w-[150px]"
              />
            ) : (
              <span className="text-xl font-bold tracking-tight text-primary">
                Multi-Tenant AI
              </span>
            )}
          </Link>
        </div>
        <nav className="grid items-start px-2 py-4 text-sm font-medium lg:px-4 flex-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto p-4 border-t">
          <div className="flex flex-col gap-2">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              {user?.email}
              <span className="block font-normal text-muted-foreground/70 truncate">
                {currentTenant?.name || "Global Admin"}
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sm:hidden">
          <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Navigation menu</span>
          </Button>
          <div className="w-full flex-1">
            {currentTenant?.branding_logo_url && (
              <img
                src={currentTenant.branding_logo_url}
                alt="Logo"
                className="h-6 w-auto"
              />
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 bg-background rounded-tl-lg border-t border-l mt-4 sm:mt-0 shadow-sm overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
