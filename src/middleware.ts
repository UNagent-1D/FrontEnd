import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/unauthorized']

const ROLE_PATHS: Record<string, string[]> = {
  '/admin': ['app_admin'],
  '/dashboard': ['app_admin', 'tenant_admin'],
  '/console': ['app_admin', 'tenant_admin'],
  '/operator': ['app_admin', 'tenant_admin', 'tenant_operator'],
}

// 30s tolerance on the JWT `exp` claim so the user isn't booted from a
// page while the clock is mid-tick between client and server.
const EXP_SKEW_SECONDS = 30

function decodeToken(
  token: string,
): { role: string; tenant_id?: string; exp?: number } | null {
  try {
    const payload = token.split('.')[1]
    const decoded = Buffer.from(payload, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function isExpired(payload: { exp?: number }): boolean {
  if (typeof payload.exp !== 'number') return false
  // JWT exp is seconds since epoch; Date.now() is ms.
  return payload.exp * 1000 + EXP_SKEW_SECONDS * 1000 < Date.now()
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname === '/') {
    return NextResponse.next()
  }

  const token = req.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = decodeToken(token)

  if (!payload || isExpired(payload)) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('auth_token')
    return res
  }

  for (const [prefix, allowedRoles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(prefix) && !allowedRoles.includes(payload.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
