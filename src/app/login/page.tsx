'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { decodeJwt, getAuthCookieClient } from '@/lib/auth'
import { LoginForm } from '@/features/auth/LoginForm'

export default function LoginPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = getAuthCookieClient()
    if (token && decodeJwt(token)) {
      router.replace('/')
      return
    }
    setChecked(true)
  }, [router])

  if (!checked) return null
  return <LoginForm />
}
