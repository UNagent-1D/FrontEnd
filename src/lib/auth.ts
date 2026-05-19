import type { Role, User } from '@/types'

export interface JwtPayload {
  user_id: string
  email: string
  role: Role
  tenant_id?: string
  exp: number
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = typeof window !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function jwtToUser(token: string): User | null {
  const payload = decodeJwt(token)
  if (!payload) return null
  return {
    id: payload.user_id,
    email: payload.email,
    role: payload.role,
    tenant_id: payload.tenant_id ?? '',
  }
}

export const AUTH_COOKIE = 'auth_token'

export function setAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 // 24h
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; SameSite=Strict; max-age=${maxAge}`
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`
}

export function getAuthCookieClient(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
