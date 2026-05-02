'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/authStore'
import { getAuthCookieClient, jwtToUser } from '@/lib/auth'

function AuthInitializer() {
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    if (!token) {
      const cookieToken = getAuthCookieClient()
      if (cookieToken) {
        const user = jwtToUser(cookieToken)
        if (user) setAuth(cookieToken, user)
      }
    }
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthInitializer />
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
