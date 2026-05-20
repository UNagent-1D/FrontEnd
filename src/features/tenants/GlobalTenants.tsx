'use client'

import { Fragment, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { isAxiosError } from "axios"
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  RefreshCw,
  UserPlus,
} from "lucide-react"

import { createTenant, createUser, listTenants, updateTenant } from "@/api/apiService"
import type { Tenant } from "@/types"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"

type ErrorDetails = {
  title: string
  description: string
  hint?: string
  status?: number
}

const describeError = (err: unknown): ErrorDetails => {
  if (isAxiosError(err)) {
    const status = err.response?.status
    const serverMsg =
      (err.response?.data as { error?: string; message?: string } | undefined)
        ?.error ||
      (err.response?.data as { error?: string; message?: string } | undefined)
        ?.message ||
      err.response?.statusText ||
      err.message
    if (status === 401 || status === 403) {
      return {
        title: "Your session is no longer authorized",
        description:
          "The Tenant service rejected this request. Your token may have expired or your role lacks the app_admin permission.",
        hint: "Sign out and sign back in with an app_admin account.",
        status,
      }
    }
    if (status === 404) {
      return {
        title: "Endpoint not found on the Tenant service",
        description: `The frontend called a route the Tenant service does not expose (HTTP 404). ${serverMsg ?? ""}`.trim(),
        hint: "Check that apiService.ts points at /api/admin/tenants and that the Tenant container is running the latest image.",
        status,
      }
    }
    if (status && status >= 500) {
      return {
        title: "Tenant service returned a server error",
        description: `HTTP ${status}. ${serverMsg ?? "No details provided."}`,
        hint: "Check the Tenant logs: docker compose logs tenant",
        status,
      }
    }
    if (err.code === "ERR_NETWORK" || !err.response) {
      return {
        title: "Cannot reach the Tenant service",
        description:
          "The browser could not connect to the Tenant API at :8080. The container may be down, restarting, or the CORS preflight was blocked.",
        hint: "Run `docker compose ps tenant` and `curl http://localhost:8080/health`.",
      }
    }
    return {
      title: "Tenant request failed",
      description: `HTTP ${status ?? "?"}: ${serverMsg ?? err.message}`,
      status,
    }
  }
  return {
    title: "Unexpected error loading organizations",
    description:
      err instanceof Error ? err.message : "An unknown error occurred.",
  }
}

const createTenantSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  name: z.string().min(2, "Name is required"),
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
})

const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  role: z.enum(["tenant_admin", "tenant_operator"]),
})

type CreateTenantForm = z.infer<typeof createTenantSchema>
type CreateUserForm = z.infer<typeof createUserSchema>

export const GlobalTenants = ({ initialTenants = [] }: { initialTenants?: Tenant[] }) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateTenant, setShowCreateTenant] = useState(false)
  const [expandedTenant, setExpandedTenant] = useState<Tenant | null>(null)

  const {
    data: tenants = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
    initialData: initialTenants,
  })

  const tenantMutation = useMutation({
    mutationFn: ({ slug, name, plan }: CreateTenantForm) =>
      createTenant({ slug, name, plan }),
    onSuccess: (newTenant) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
      toast({
        title: "Tenant + bot creado",
        description: `"${newTenant.name}" listo. Se aprovisionó un perfil agente por defecto.`,
      })
      setShowCreateTenant(false)
    },
    onError: (err) => {
      const details = describeError(err)
      toast({
        variant: "destructive",
        title: details.title,
        description: details.description,
      })
    },
  })

  const userMutation = useMutation({
    mutationFn: (data: CreateUserForm & { tenant_id: string }) =>
      createUser(data),
    onSuccess: () => {
      toast({
        title: "User created",
        description: "The user was created and assigned to the tenant.",
      })
      setExpandedTenant(null)
    },
    onError: (err) => {
      const details = describeError(err)
      toast({
        variant: "destructive",
        title: details.title,
        description: details.description,
      })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' | 'churned' }) =>
      updateTenant(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
      toast({ title: "Status updated" })
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not update status." })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Crea y administra tenants. Cada nuevo tenant aprovisiona automáticamente un perfil agente activo y su configuración ACR."
        actions={
          <Button onClick={() => setShowCreateTenant((v) => !v)} className="gap-2">
            <PlusCircle className="size-4" />
            Crear tenant + bot
          </Button>
        }
      />

      {showCreateTenant ? (
        <CreateTenantCard
          onSubmit={(data) => tenantMutation.mutate(data)}
          onCancel={() => setShowCreateTenant(false)}
          isLoading={tenantMutation.isPending}
        />
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Active organizations</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading organizations..."
              : `${tenants.length} organization${tenants.length === 1 ? "" : "s"} registered`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <TenantsErrorState
              error={error}
              isRetrying={isFetching}
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Building2}
                title="No tenants yet"
                description="Create your first organization to start provisioning users and agents."
                action={
                  <Button
                    onClick={() => setShowCreateTenant(true)}
                    className="gap-2"
                  >
                    <PlusCircle className="size-4" />
                    Create tenant
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const isExpanded = expandedTenant?.id === tenant.id
                  return (
                    <Fragment key={tenant.id}>
                      <TableRow
                        className={cn(isExpanded && "bg-muted/30")}
                      >
                        <TableCell className="font-medium">
                          {tenant.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tenant.domain ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tenant.status}
                            onValueChange={(value) =>
                              statusMutation.mutate({ id: tenant.id, status: value as 'active' | 'suspended' | 'churned' })
                            }
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="churned">Churned</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {tenant.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() =>
                              setExpandedTenant(isExpanded ? null : tenant)
                            }
                          >
                            <UserPlus className="size-3.5" />
                            Add user
                            {isExpanded ? (
                              <ChevronUp className="size-3.5" />
                            ) : (
                              <ChevronDown className="size-3.5" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5} className="bg-muted/20 p-4">
                            <CreateUserInlineForm
                              onSubmit={(data) =>
                                userMutation.mutate({
                                  ...data,
                                  tenant_id: tenant.id,
                                })
                              }
                              isLoading={userMutation.isPending}
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const TenantsErrorState = ({
  error,
  isRetrying,
  onRetry,
}: {
  error: unknown
  isRetrying: boolean
  onRetry: () => void
}) => {
  const details = describeError(error)
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-destructive">
              {details.title}
            </p>
            {details.status ? (
              <Badge variant="destructive" className="font-mono text-[10px]">
                HTTP {details.status}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{details.description}</p>
          {details.hint ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Next step: </span>
              {details.hint}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="gap-2"
        >
          <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying…" : "Retry"}
        </Button>
      </div>
    </div>
  )
}

const CreateTenantCard = ({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: CreateTenantForm) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { slug: "", name: "", plan: "free" },
  })

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-lg">Crear tenant + bot</CardTitle>
        <CardDescription>
          Creates the tenant in Postgres, provisions its per-tenant schema,
          and seeds a default Hospital-base agent profile + active ACR
          config — all in one shot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="acme-clinic" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="ACME Clinic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="free">free</option>
                        <option value="starter">starter</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear tenant + bot"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

const CreateUserInlineForm = ({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: CreateUserForm) => void
  isLoading: boolean
}) => {
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "tenant_operator",
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3"
      >
        <p className="text-sm font-medium text-muted-foreground">
          New user for this organization
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Role *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tenant_admin">Tenant admin</SelectItem>
                    <SelectItem value="tenant_operator">
                      Tenant operator
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create user"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
