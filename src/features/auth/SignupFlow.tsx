'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

import { useAuthStore } from '@/store/authStore'
import { useTenantStore } from '@/store/tenantStore'
import { useToast } from '@/hooks/use-toast'
import {
  createUserAuthAccount,
  requestOtp,
  resendOtp,
  verifyOtp,
} from '@/api/apiService'
import { setAuthCookie } from '@/lib/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

// ---------------------------------------------------------------------------
// Step 1: collect identity
// ---------------------------------------------------------------------------

const signupSchema = z.object({
  user_name: z.string().min(1, 'Required').max(64),
  user_last_name: z.string().min(1, 'Required').max(64),
  user_email: z.string().email('Invalid email').max(64),
  user_document: z
    .string()
    .min(3, 'Document must be at least 3 chars')
    .max(64),
  tenant_slug: z
    .string()
    .min(1, 'Required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
})

type SignupFormValues = z.infer<typeof signupSchema>

// ---------------------------------------------------------------------------
// Step 2: verify OTP
// ---------------------------------------------------------------------------

const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Numeric only'),
})

type OtpFormValues = z.infer<typeof otpSchema>

// ---------------------------------------------------------------------------
// Flow component
// ---------------------------------------------------------------------------

type Step = 'form' | 'otp'

export function SignupFlow() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setTenant = useTenantStore((s) => s.setTenant)
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('form')
  const [pendingDocument, setPendingDocument] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      user_name: '',
      user_last_name: '',
      user_email: '',
      user_document: '',
      tenant_slug: 'demo-hospital',
    },
  })

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  })

  async function onSignup(values: SignupFormValues) {
    setIsLoading(true)
    try {
      // Resolve the tenant ID from the slug. We use a placeholder UUID
      // here; the new Phase 2 work will fetch real tenant IDs from
      // Tenant. For now, accept that the tenant must exist in the DB
      // with the typed slug.
      // TODO(phase 2): GET /api/v1/tenants/by-slug/:slug → resolve tenant_id.
      const tenantIdGuess = '00000000-0000-0000-0000-000000000000'

      await createUserAuthAccount({
        tenant_id: tenantIdGuess,
        tenant_slug: values.tenant_slug,
        user_name: values.user_name,
        user_last_name: values.user_last_name,
        user_document: values.user_document,
        user_email: values.user_email,
      })
      await requestOtp(values.user_document)
      setPendingDocument(values.user_document)
      setStep('otp')
      toast({
        title: 'Te enviamos un código',
        description: `Revisa tu correo (${values.user_email}). El código expira en 5 minutos.`,
      })
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Could not send code'
      toast({ variant: 'destructive', title: 'Signup failed', description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  async function onVerify(values: OtpFormValues) {
    setIsLoading(true)
    try {
      const result = await verifyOtp(pendingDocument, values.code)
      setAuthCookie(result.token)
      setAuth(result.token, result.user)

      if (result.user.tenant_id) {
        setTenant({
          id: result.user.tenant_id,
          slug: '',
          name: result.user.tenant_id,
          plan: '',
          status: 'active',
          is_active: true,
          created_at: '',
          updated_at: '',
        })
      } else {
        useTenantStore.getState().clearTenant()
      }

      toast({
        title: 'Cuenta activa',
        description: `Bienvenido. Rol: ${result.user.role}.`,
      })

      if (result.user.role === 'app_admin') router.push('/admin/tenants')
      else if (result.user.role === 'tenant_admin')
        router.push('/dashboard/profiles')
      else router.push('/operator/dashboard')
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Invalid code'
      toast({ variant: 'destructive', title: 'Verification failed', description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  async function onResend() {
    if (!pendingDocument) return
    setIsLoading(true)
    try {
      await resendOtp(pendingDocument)
      toast({ title: 'Código reenviado', description: 'Mira tu correo de nuevo.' })
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo reenviar' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{step === 'form' ? 'Crear cuenta' : 'Verifica tu correo'}</CardTitle>
          <CardDescription>
            {step === 'form'
              ? 'Te enviaremos un código de un solo uso para confirmar tu correo.'
              : `Ingresa el código de 6 dígitos que enviamos al correo registrado para ${pendingDocument}.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'form' ? (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={signupForm.control}
                    name="user_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input autoComplete="given-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="user_last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input autoComplete="family-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={signupForm.control}
                  name="user_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="user_document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" {...field} />
                      </FormControl>
                      <FormDescription>
                        Identificador único (cédula, pasaporte, etc.).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="tenant_slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant (slug)</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" {...field} />
                      </FormControl>
                      <FormDescription>
                        Para esta demo: <code>demo-hospital</code>.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Enviando…' : 'Enviar código'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código (6 dígitos)</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="000000"
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verificando…' : 'Verificar y entrar'}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-muted-foreground hover:underline"
                  >
                    ← Cambiar datos
                  </button>
                  <button
                    type="button"
                    onClick={onResend}
                    className="text-muted-foreground hover:underline"
                    disabled={isLoading}
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-foreground hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
