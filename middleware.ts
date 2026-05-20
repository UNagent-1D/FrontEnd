import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/unauthorized']

const ROLE_PATHS: Record<string, string[]> = {
  '/admin': ['app_admin'],
  '/dashboard': ['app_admin', 'tenant_admin'],
  '/console': ['app_admin', 'tenant_admin'],
  '/operator': ['app_admin', 'tenant_admin', 'tenant_operator'],
}

function decodeToken(token: string): { role: string; tenant_id?: string } | null {
  try {
    const payload = token.split('.')[1]
    const decoded = Buffer.from(payload, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
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

  if (!payload) {
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
