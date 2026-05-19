import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decodeJwt } from '@/lib/auth'
import { LoginForm } from '@/features/auth/LoginForm'

export default async function LoginPage() {
  const store = await cookies()
  const token = store.get('auth_token')?.value
  if (token && decodeJwt(token)) {
    redirect('/')
  }

  return <LoginForm />
}
