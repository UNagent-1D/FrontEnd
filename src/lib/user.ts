import type { User } from "@/types"

function titleCase(input: string): string {
  if (!input) return ""
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
}

export function getDisplayName(user: User | null | undefined): string {
  if (!user?.email) return "there"
  const local = user.email.split("@")[0] ?? ""
  const first = local.split(/[._\-+]/)[0] ?? ""
  return titleCase(first) || "there"
}

export function getInitials(user: User | null | undefined): string {
  if (!user?.email) return "U"
  const local = user.email.split("@")[0] ?? ""
  const parts = local.split(/[._\-+]/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
