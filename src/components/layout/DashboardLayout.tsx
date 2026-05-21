'use client'

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart2,
  Headset,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  UserCog,
  Users,
} from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import { useTenantStore } from "@/store/tenantStore"
import { useDarkMode } from "@/hooks/useDarkMode"
import { clearAuthCookie } from "@/lib/auth"
import { getDisplayName, getInitials } from "@/lib/user"
import { roleBadgeVariant, roleLabel } from "@/lib/palette"
import { listTenants } from "@/api/apiService"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Role, Tenant } from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

// Several entries are hidden from the sidebar while the demo is single-
// tenant: "Global Tenants" (/admin/tenants), "Agent Profiles"
// (/dashboard/profiles), and "Data Sources" (/dashboard/datasources). All
// three routes still render if typed directly so we can debug or demo them
// on demand. Re-add the nav entries here when there's a real use case.
const navItems: NavItem[] = [
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart2, roles: ["app_admin", "tenant_admin"] },
  { title: "Users", href: "/dashboard/users", icon: Users, roles: ["app_admin", "tenant_admin"] },
  { title: "Agent Console", href: "/console", icon: MessageCircle, roles: ["app_admin", "tenant_admin"] },
  { title: "Operator Panel", href: "/operator/dashboard", icon: Headset, roles: ["app_admin", "tenant_admin", "tenant_operator"] },
  { title: "My Profile", href: "/dashboard/profile", icon: UserCog, roles: ["app_admin", "tenant_admin", "tenant_operator"] },
]

function LogoChip() {
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
      <Image src="/logo-icon.png" alt="UNAgent" fill className="object-contain" />
    </div>
  )
}

function SidebarBody({
  filteredNavItems,
  pathname,
  onNavigate,
}: {
  filteredNavItems: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4 text-sm font-medium">
      {filteredNavItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
              isActive
                ? "bg-accent text-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function UserBlock({
  onSignOut,
}: {
  onSignOut: () => void
}) {
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback>{getInitials(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sign out</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-3">
        <Badge variant={roleBadgeVariant[user.role]}>{roleLabel[user.role]}</Badge>
      </div>
    </div>
  )
}

function TenantSwitcher() {
  const user = useAuthStore((s) => s.user)
  const currentTenant = useTenantStore((s) => s.currentTenant)
  const setTenant = useTenantStore((s) => s.setTenant)

  const isAppAdmin = user?.role === "app_admin"

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: listTenants,
    enabled: isAppAdmin,
    staleTime: 60_000,
  })

  if (!isAppAdmin) {
    if (currentTenant) {
      return (
        <Badge variant="outline" className="gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          {currentTenant.name}
        </Badge>
      )
    }
    return null
  }

  if (!tenants || tenants.length === 0) {
    return <Badge variant="outline">Global admin</Badge>
  }

  const selectedId = currentTenant?.id ?? ""

  return (
    <Select
      value={selectedId}
      onValueChange={(id) => {
        const t = tenants.find((x) => x.id === id)
        if (t) setTenant(t)
      }}
    >
      <SelectTrigger className="h-9 w-[200px]">
        <SelectValue placeholder="Select tenant" />
      </SelectTrigger>
      <SelectContent>
        {tenants.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DarkModeToggle() {
  const { theme, toggle } = useDarkMode()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" aria-label="Toggle dark mode">
        <Moon className="size-4" />
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggle}
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {theme === "dark" ? "Switch to light" : "Switch to dark"}
      </TooltipContent>
    </Tooltip>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const clearTenant = useTenantStore((s) => s.clearTenant)
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    setMobileOpen(false)
    clearAuthCookie()
    clearAuth()
    clearTenant()
    router.push("/login")
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role as Role)
  )

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <LogoChip />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">Un Agent</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Asesores en Salud
            </span>
          </div>
        </div>
        <SidebarBody
          filteredNavItems={filteredNavItems}
          pathname={pathname}
        />
        <UserBlock onSignOut={handleLogout} />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center gap-2 border-b px-4">
                  <LogoChip />
                  <span className="text-sm font-bold tracking-tight">
                    Un Agent
                  </span>
                </div>
                <SidebarBody
                  filteredNavItems={filteredNavItems}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
                <UserBlock onSignOut={handleLogout} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center gap-3">
            <TenantSwitcher />
          </div>

          <div className="flex items-center gap-1">
            <DarkModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
