'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { BarChart3, Eye, EyeOff, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { useTenantStore } from '@/store/tenantStore'
import { useToast } from '@/hooks/use-toast'
import { login } from '@/api/apiService'
import { setAuthCookie } from '@/lib/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

const features = [
  { icon: MessageSquare, title: 'Omnichannel conversations', body: 'Unify chat, email, and voice into one operator view.' },
  { icon: ShieldCheck, title: 'Role-based access', body: 'App admins, tenant admins, and operators — each with the right scope.' },
  { icon: BarChart3, title: 'Live operations metrics', body: 'Watch volume, escalations, and resolution times in real time.' },
]

export function LoginForm() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setTenant = useTenantStore((s) => s.setTenant)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      const result = await login(data)

      setAuthCookie(result.token)
      setAuth(result.token, result.user)

      if (result.user.tenant_id) {
        setTenant({ id: result.user.tenant_id, name: result.user.tenant_id, is_active: true, created_at: '', updated_at: '' })
      } else {
        useTenantStore.getState().clearTenant()
      }

      toast({ title: 'Signed in', description: `Welcome. Role: ${result.user.role}.` })

      if (result.user.role === 'app_admin') router.push('/admin/tenants')
      else if (result.user.role === 'tenant_admin') router.push('/dashboard/profiles')
      else router.push('/operator/dashboard')
    } catch {
      toast({ variant: 'destructive', title: 'Invalid credentials', description: 'Check your email and password and try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <div className="relative flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
            <Image src="/logo-icon.png" alt="UNAgent" fill className="object-contain" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest opacity-70">UNAgent</p>
            <p className="text-xs opacity-70">Admin console</p>
          </div>
        </div>
        <div className="relative space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5" />
              AI support for every tenant
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Run your AI agents with confidence.</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-80">
              Configure profiles, wire data sources, watch conversations, and keep operators in the loop — all from one place.
            </p>
          </div>
          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
                  <f.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs opacity-75">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs opacity-60">© {new Date().getFullYear()} UNAgent platform</p>
      </aside>

      <section className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Sign in to manage your agents and operators.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" type="email" autoComplete="email" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" disabled className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:cursor-not-allowed">
                              Forgot password?
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Contact your admin</TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="Your password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" disabled={isLoading} className="pr-10" {...field} />
                          <button type="button" onClick={() => setShowPassword((s) => !s)} disabled={isLoading} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
