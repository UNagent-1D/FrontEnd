import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type DataSource } from "@/types";
import { getDataSources, createDataSource, updateDataSource } from "@/api/apiService";
import { useAuthStore } from "@/store/authStore";
import { useTenantStore } from "@/store/tenantStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Database, Trash2, PlusCircle } from "lucide-react";

type RouteRow = { id: string; keyName: string; method: "GET" | "POST" | "PATCH" | "DELETE"; path: string };

function routesToArray(route_configs: Record<string, { method: string; path: string }>): RouteRow[] {
  return Object.entries(route_configs).map(([key, val], i) => ({
    id: String(i),
    keyName: key,
    method: val.method as RouteRow["method"],
    path: val.path,
  }));
}

function arrayToRoutes(rows: RouteRow[]) {
  return rows.reduce<Record<string, { method: string; path: string }>>((acc, r) => {
    if (r.keyName) acc[r.keyName] = { method: r.method, path: r.path };
    return acc;
  }, {});
}

// ── Create form ──────────────────────────────────────────────────────────────

type CreateForm = {
  name: string;
  source_type: "scheduling" | "patient_registry";
  base_url: string;
  routes: RouteRow[];
};

function CreateDataSourceCard({ tenantId, onCancel }: { tenantId: string; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateForm>({
    defaultValues: { name: "", source_type: "scheduling", base_url: "", routes: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "routes" });

  const mutation = useMutation({
    mutationFn: (values: CreateForm) =>
      createDataSource(tenantId, {
        name: values.name,
        source_type: values.source_type,
        base_url: values.base_url,
        route_configs: arrayToRoutes(values.routes),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sources", tenantId] });
      toast({ title: "Data source created" });
      onCancel();
    },
    onError: () => toast({ variant: "destructive", title: "Error creating data source" }),
  });

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-lg">New data source</CardTitle>
        <CardDescription>Add an external API the agent can query.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input placeholder="Hospital API" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="source_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="scheduling">Scheduling</SelectItem>
                      <SelectItem value="patient_registry">Patient Registry</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="base_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL *</FormLabel>
                  <FormControl><Input placeholder="http://localhost:8080" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <RouteConfigFields fields={fields} form={form} append={append} remove={remove} />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

type EditForm = { routes: RouteRow[] };

function DataSourceCard({ ds, tenantId }: { ds: DataSource; tenantId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditForm>({
    defaultValues: { routes: routesToArray(ds.route_configs) },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "routes" });

  const mutation = useMutation({
    mutationFn: (values: EditForm) =>
      updateDataSource(tenantId, ds.id, { route_configs: arrayToRoutes(values.routes) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sources", tenantId] });
      toast({ title: "Data source updated" });
    },
    onError: () => toast({ variant: "destructive", title: "Error updating data source" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ds.name}</CardTitle>
        <CardDescription className="font-mono text-xs">{ds.base_url}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <RouteConfigFields fields={fields} form={form} append={append} remove={remove} />
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Shared route fields ───────────────────────────────────────────────────────

function RouteConfigFields({ fields, form, append, remove }: any) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Route Configuration</h3>
      {fields.map((field: any, index: number) => (
        <div key={field.id} className="grid grid-cols-10 items-end gap-2 rounded-md border p-3">
          <FormField control={form.control} name={`routes.${index}.keyName`} render={({ field }) => (
            <FormItem className="col-span-3">
              <FormLabel>Operation</FormLabel>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name={`routes.${index}.method`} render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name={`routes.${index}.path`} render={({ field }) => (
            <FormItem className="col-span-4">
              <FormLabel>Path</FormLabel>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )} />
          <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="col-span-1 justify-self-end">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ id: String(fields.length), keyName: "", method: "GET", path: "" })}>
        <PlusCircle className="mr-2 h-4 w-4" />Add Route
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const DataSourcesManager = () => {
  const [showCreate, setShowCreate] = useState(false);
  const user = useAuthStore((s) => s.user);
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const tenantId = currentTenant?.id ?? user?.tenant_id ?? "";

  const { data: dataSources = [], isLoading, isError } = useQuery({
    queryKey: ["data-sources", tenantId],
    queryFn: () => getDataSources(tenantId),
    enabled: !!tenantId,
  });

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Data Sources" description="Configure the endpoints for external systems the agent can query." />
        <EmptyState icon={Database} title="No tenant selected" description="Select a tenant from the top bar to manage its data sources." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description="Configure the endpoints for external systems the agent can query."
        actions={
          <Button onClick={() => setShowCreate((v) => !v)} className="gap-2">
            <PlusCircle className="size-4" />New data source
          </Button>
        }
      />

      {showCreate && <CreateDataSourceCard tenantId={tenantId} onCancel={() => setShowCreate(false)} />}

      {isError && <p className="text-sm text-destructive">Error loading data sources.</p>}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : dataSources.length === 0 && !showCreate ? (
        <EmptyState
          icon={Database}
          title="No data sources configured"
          description="Hook up an external API so the agent can query live information."
          action={<Button onClick={() => setShowCreate(true)} className="gap-2"><PlusCircle className="size-4" />New data source</Button>}
        />
      ) : (
        dataSources.map((ds) => <DataSourceCard key={ds.id} ds={ds} tenantId={tenantId} />)
      )}
    </div>
  );
};
