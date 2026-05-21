'use client'

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Database, Trash2, PlusCircle, Info } from "lucide-react";

// Same constant the Operator panel uses. Override via env when multi-tenant
// management comes back.
const DEMO_HOSPITAL_TENANT_ID =
  process.env.NEXT_PUBLIC_DEMO_HOSPITAL_TENANT_ID ??
  "ce5ac1c5-9b16-486a-b091-5468d232a4b8";

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

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  source_type: z.enum(["scheduling", "patient_registry"]),
  base_url: z.string().url("Must be a valid URL (e.g. http://hospital-mock:8080)"),
  routes: z
    .array(
      z.object({
        id: z.string(),
        keyName: z.string().min(1, "Operation name is required"),
        method: z.enum(["GET", "POST", "PATCH", "DELETE"]),
        path: z.string().min(1, "Path is required"),
      }),
    )
    .min(1, "Add at least one route"),
});

type CreateForm = z.infer<typeof createSchema>;

function CreateDataSourceCard({ tenantId, onCancel }: { tenantId: string; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      source_type: "scheduling",
      base_url: "",
      // Pre-fill one empty route so the form doesn't look broken on open.
      routes: [{ id: "0", keyName: "", method: "GET", path: "" }],
    },
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
    onError: (err: any) => {
      // Show the backend's verbatim error so misconfigs (e.g. unknown
      // source_type enum) are obvious instead of a generic toast.
      const msg = err?.response?.data?.error ?? err?.message ?? "Error creating data source";
      toast({ variant: "destructive", title: "Could not create data source", description: msg });
    },
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
                  <FormControl><Input placeholder="http://hospital-mock:8080" {...field} /></FormControl>
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
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.message ?? "Error updating data source";
      toast({ variant: "destructive", title: "Could not update data source", description: msg });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate">{ds.name}</CardTitle>
          <CardDescription className="font-mono text-xs truncate">{ds.base_url}</CardDescription>
        </div>
        <Badge variant="secondary" className="shrink-0 font-normal capitalize">
          {ds.source_type.replace("_", " ")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Read-friendly summary so a casual viewer grokks the wiring
            before deciding to edit. Mirrors what the agent actually calls. */}
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Operations exposed to the bot ({Object.keys(ds.route_configs).length})
          </p>
          <ul className="space-y-1 text-xs font-mono">
            {Object.entries(ds.route_configs).map(([op, cfg]) => (
              <li key={op} className="flex items-center gap-2">
                <Badge variant="outline" className="w-12 justify-center text-[10px]">
                  {cfg.method}
                </Badge>
                <span className="text-muted-foreground">{cfg.path}</span>
                <span className="text-muted-foreground/60">→</span>
                <span className="font-semibold">{op}</span>
              </li>
            ))}
          </ul>
        </div>

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
  const canRemove = fields.length > 1;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Route Configuration</h3>
      <p className="text-xs text-muted-foreground">
        Each row maps a tool name (e.g. <code>list_doctors</code>) to an HTTP method + path on the data source.
        Use <code>{"{placeholders}"}</code> for path parameters — the agent fills them from the LLM&apos;s tool arguments.
      </p>
      {fields.map((field: any, index: number) => (
        <div
          key={field.id}
          className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,2fr)_40px] md:items-end"
        >
          <FormField control={form.control} name={`routes.${index}.keyName`} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Operation</FormLabel>
              <FormControl><Input placeholder="list_doctors" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name={`routes.${index}.method`} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Method</FormLabel>
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
            <FormItem>
              <FormLabel className="text-xs">Path</FormLabel>
              <FormControl><Input placeholder="/doctors/{doctor_id}/schedule" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canRemove}
            onClick={() => remove(index)}
            title={canRemove ? "Remove route" : "At least one route is required"}
            className="justify-self-end text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ id: String(fields.length), keyName: "", method: "GET", path: "" })}>
        <PlusCircle className="mr-2 h-4 w-4" />Add Route
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface DataSourcesManagerProps {
  initialData?: DataSource[]
  tenantId?: string
}

export const DataSourcesManager = ({ initialData, tenantId: tenantIdProp }: DataSourcesManagerProps = {}) => {
  const [showCreate, setShowCreate] = useState(false);
  const user = useAuthStore((s) => s.user);
  const currentTenant = useTenantStore((s) => s.currentTenant);
  // Pin to Demo Hospital when no tenant context (app_admin's JWT has no
  // tenant_id; tenantStore may be empty until they pick something). Same
  // constant used by OperatorDashboard.
  const tenantId =
    tenantIdProp ?? currentTenant?.id ?? user?.tenant_id ?? DEMO_HOSPITAL_TENANT_ID;

  const { data: dataSources = [], isLoading, isError, error } = useQuery({
    queryKey: ["data-sources", tenantId],
    queryFn: () => getDataSources(tenantId),
    initialData: initialData,
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description="External APIs your bot can query. Each route maps a tool name to an HTTP method + path."
        actions={
          <Button onClick={() => setShowCreate((v) => !v)} className="gap-2">
            <PlusCircle className="size-4" />New data source
          </Button>
        }
      />

      <Card className="border-muted bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4 text-primary" />
            What is this page?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            A <strong>data source</strong> is an external API your bot can query. The card
            below (<em>Hospital-Mock Scheduling</em>) ships pre-wired to the hospital mock
            backend with 6 operations ready to use.
          </p>
          <p>
            Each row in <strong>Route Configuration</strong> maps a tool name (e.g.{" "}
            <code className="rounded bg-muted px-1 text-xs">list_doctors</code>) to an HTTP
            method + path on the data source. When the LLM decides to call the tool, the
            agent builds the request from that route.
          </p>
          <p>
            The <code className="rounded bg-muted px-1 text-xs">{"{placeholders}"}</code> in
            the path are filled at call time from the LLM's tool arguments. For example,{" "}
            <code className="rounded bg-muted px-1 text-xs">{"/doctors/{doctor_id}/schedule"}</code>{" "}
            becomes{" "}
            <code className="rounded bg-muted px-1 text-xs">/doctors/doc-001/schedule</code>{" "}
            when the bot wants <code className="rounded bg-muted px-1 text-xs">doc-001</code>'s schedule.
          </p>
          <p>
            Edits take effect on the bot's next turn — no restart needed.
          </p>
        </CardContent>
      </Card>

      {showCreate && <CreateDataSourceCard tenantId={tenantId} onCancel={() => setShowCreate(false)} />}

      {isError && (
        <p className="text-sm text-destructive">
          {(error as any)?.response?.data?.error ?? "Error loading data sources."}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : dataSources.length === 0 && !showCreate ? (
        <EmptyState
          icon={Database}
          title="No data sources configured"
          description="Hook up an external API so the agent can query live information."
          action={
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <PlusCircle className="size-4" />New data source
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {dataSources.map((ds) => (
            <DataSourceCard key={ds.id} ds={ds} tenantId={tenantId} />
          ))}
        </div>
      )}
    </div>
  );
};
