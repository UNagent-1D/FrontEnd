'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, ShieldCheck, User } from 'lucide-react'

import { changePassword } from '@/api/apiService'
import { useAuthStore } from '@/store/authStore'
import { roleBadgeVariant, roleLabel } from '@/lib/palette'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Required'),
    new_password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string().min(1, 'Required'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

export const ProfileSettings = () => {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  const onSubmit = async (values: PasswordForm) => {
    setSubmitting(true)
    try {
      await changePassword(values.current_password, values.new_password)
      toast({ title: 'Password updated' })
      form.reset()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Could not update password'
      toast({ variant: 'destructive', title: 'Error', description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Manage your account details and credentials." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            Account information
          </CardTitle>
          <CardDescription>Read-only details from your JWT session.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-1 font-mono text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</dt>
              <dd className="mt-1">
                <Badge variant={roleBadgeVariant[user.role]}>{roleLabel[user.role]}</Badge>
              </dd>
            </div>
            {user.tenant_id && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tenant ID</dt>
                <dd className="mt-1 font-mono text-sm">{user.tenant_id}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User ID</dt>
              <dd className="mt-1 font-mono text-sm">{user.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Change password
          </CardTitle>
          <CardDescription>New password must be at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="gap-2">
                  <ShieldCheck className="size-4" />
                  {submitting ? 'Saving…' : 'Update password'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => form.reset()}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
