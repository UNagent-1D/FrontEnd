import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decodeJwt } from '@/lib/auth'

export default async function RootPage() {
  const store = await cookies()
  const token = store.get('auth_token')?.value

  if (!token) {
    redirect('/login')
  }

  const payload = decodeJwt(token)

  if (!payload) {
    redirect('/login')
  }

  switch (payload.role) {
    case 'app_admin':
      redirect('/admin/tenants')
    case 'tenant_admin':
      redirect('/dashboard/profiles')
    case 'tenant_operator':
      redirect('/operator/dashboard')
    default:
      redirect('/login')
  }
}
