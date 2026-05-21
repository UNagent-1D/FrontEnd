'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { decodeJwt, getAuthCookieClient } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = getAuthCookieClient()
    if (!token) {
      router.replace('/login')
      return
    }

    const payload = decodeJwt(token)
    if (!payload) {
      router.replace('/login')
      return
    }

    switch (payload.role) {
      case 'app_admin':
        router.replace('/admin/tenants')
        break
      case 'tenant_admin':
        router.replace('/dashboard/profiles')
        break
      case 'tenant_operator':
        router.replace('/operator/dashboard')
        break
      default:
        router.replace('/login')
    }
  }, [router])

  return null
}
