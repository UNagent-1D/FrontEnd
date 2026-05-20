import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decodeJwt } from '@/lib/auth'
import { SignupFlow } from '@/features/auth/SignupFlow'

export default async function SignupPage() {
  const store = await cookies()
  const token = store.get('auth_token')?.value
  if (token && decodeJwt(token)) {
    redirect('/')
  }

  return <SignupFlow />
}
