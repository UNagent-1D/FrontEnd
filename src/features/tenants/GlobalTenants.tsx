import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTenants, createTenant, createUser } from '@/api/apiService';
import type { Tenant } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, UserPlus, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';

// ── Schemas ──────────────────────────────────────────────────────────

const createTenantSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  domain: z.string().optional(),
});

const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  role: z.enum(['tenant_admin', 'tenant_operator']),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;
type CreateUserForm = z.infer<typeof createUserSchema>;

// ── Main Component ────────────────────────────────────────────────────

export const GlobalTenants = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const { data: tenants = [], isLoading, isError } = useQuery({
    queryKey: ['tenants'],
    queryFn: listTenants,
  });

  const tenantMutation = useMutation({
    mutationFn: ({ name, domain }: CreateTenantForm) => createTenant(name, domain),
    onSuccess: (newTenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Organization created', description: `"${newTenant.name}" was created successfully.` });
      setShowCreateTenant(false);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create the organization.' });
    },
  });

  const userMutation = useMutation({
    mutationFn: (data: CreateUserForm & { tenant_id: string }) =>
      createUser({ ...data, tenant_id: data.tenant_id }),
    onSuccess: () => {
      toast({ title: 'User created', description: 'The user was created and assigned to the tenant.' });
      setSelectedTenant(null);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create the user.' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-muted-foreground">Provision and manage all tenants on the platform.</p>
        </div>
        <Button onClick={() => setShowCreateTenant((v) => !v)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Create Tenant Form */}
      {showCreateTenant && (
        <CreateTenantCard
          onSubmit={(data) => tenantMutation.mutate(data)}
          onCancel={() => setShowCreateTenant(false)}
          isLoading={tenantMutation.isPending}
        />
      )}

      {/* Tenant List */}
      <Card>
        <CardHeader>
          <CardTitle>Active organizations</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${tenants.length} organization(s) registered`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive">Error loading organizations.</p>
          )}
          {!isLoading && tenants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No organizations registered.</p>
          )}
          <div className="divide-y">
            {tenants.map((tenant) => (
              <TenantRow
                key={tenant.id}
                tenant={tenant}
                isExpanded={selectedTenant?.id === tenant.id}
                onToggleUser={() =>
                  setSelectedTenant((prev) => (prev?.id === tenant.id ? null : tenant))
                }
                onCreateUser={(data) =>
                  userMutation.mutate({ ...data, tenant_id: tenant.id })
                }
                isUserLoading={userMutation.isPending}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Create Tenant Card ────────────────────────────────────────────────

const CreateTenantCard = ({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: CreateTenantForm) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: '', domain: '' },
  });

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-lg">New Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl><Input placeholder="Acme Corp" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl><Input placeholder="acme.app.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// ── Tenant Row ────────────────────────────────────────────────────────

const TenantRow = ({
  tenant,
  isExpanded,
  onToggleUser,
  onCreateUser,
  isUserLoading,
}: {
  tenant: Tenant;
  isExpanded: boolean;
  onToggleUser: () => void;
  onCreateUser: (data: CreateUserForm) => void;
  isUserLoading: boolean;
}) => {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="font-medium">{tenant.name}</p>
          <p className="text-xs text-muted-foreground">
            ID: {tenant.id}
            {tenant.domain ? ` · ${tenant.domain}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tenant.is_active ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <XCircle className="h-3 w-3" /> Inactive
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onToggleUser}>
            <UserPlus className="mr-1 h-3 w-3" />
            Add User
            {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pl-4 border-l-2 border-muted">
          <CreateUserInlineForm
            onSubmit={onCreateUser}
            isLoading={isUserLoading}
          />
        </div>
      )}
    </div>
  );
};

// ── Create User Inline Form ───────────────────────────────────────────

const CreateUserInlineForm = ({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: CreateUserForm) => void;
  isLoading: boolean;
}) => {
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', password: '', first_name: '', last_name: '', role: 'tenant_operator' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
        <p className="text-sm font-medium text-muted-foreground">New user for this organization</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input type="email" {...field} /></FormControl>
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
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                    <SelectItem value="tenant_operator">Tenant Operator</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
