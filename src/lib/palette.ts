import type { Role } from "@/types"

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"

export const roleLabel: Record<Role, string> = {
  app_admin: "App admin",
  tenant_admin: "Tenant admin",
  tenant_operator: "Operator",
}

export const roleBadgeVariant: Record<Role, BadgeVariant> = {
  app_admin: "default",
  tenant_admin: "info",
  tenant_operator: "secondary",
}
