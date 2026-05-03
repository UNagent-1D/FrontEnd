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
import {
  Building2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
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

const createTenantSchema = z.object({
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9]+$/, "Only lowercase letters and numbers (no hyphens)"),
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
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
    initialData: initialTenants,
  })

  const tenantMutation = useMutation({
    mutationFn: ({ slug, name, plan }: CreateTenantForm) =>
      createTenant(slug, name, plan),
    onSuccess: (newTenant) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] })
      toast({
        title: "Organization created",
        description: `"${newTenant.name}" was created successfully.`,
      })
      setShowCreateTenant(false)
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the organization.",
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
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the user.",
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
        title="Organization Management"
        description="Provision and manage all tenants on the platform."
        actions={
          <Button onClick={() => setShowCreateTenant((v) => !v)} className="gap-2">
            <PlusCircle className="size-4" />
            New organization
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
            <div className="p-6 text-sm text-destructive">
              Error loading organizations.
            </div>
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
                  <TableHead>Reference</TableHead>
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
                          {tenant.slug}
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
        <CardTitle className="text-lg">New organization</CardTitle>
        <CardDescription>
          Provision a tenant and assign users afterwards.
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
                      <Input placeholder="acme-corp" {...field} />
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
                      <Input placeholder="Acme Corp" {...field} />
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
                    <FormLabel>Plan *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
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
                {isLoading ? "Creating..." : "Create organization"}
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
