'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Trash2, PlusCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getAgentConfigs, getActiveAgentConfig,
  createAgentProfile, updateAgentProfile,
  createAgentConfig, updateAgentConfig, activateAgentConfig,
} from '@/api/apiService'
import type { BackendAgentProfile, BackendTool, BackendAgentConfig } from '@/types'

interface DashboardProfilesProps {
  tenantId: string
  initialProfiles: BackendAgentProfile[]
  tools: BackendTool[]
}

type FormValues = {
  name: string
  description: string
  allowed_specialties: { value: string }[]
  allowed_locations: { value: string }[]
  tool_permissions: { name: string; description: string; enabled: boolean }[]
}

function buildDefaults(
  profile: BackendAgentProfile | null,
  config: BackendAgentConfig | null,
  activeTools: BackendTool[],
): FormValues {
  const enabled = config?.tool_permissions?.map((tp) => tp.tool_name) ?? []
  return {
    name: profile?.name ?? '',
    description: profile?.description ?? '',
    allowed_specialties: (profile?.allowed_specialties ?? []).map((v) => ({ value: v })),
    allowed_locations: (profile?.allowed_locations ?? []).map((v) => ({ value: v })),
    tool_permissions: activeTools.map((t) => ({
      name: t.name,
      description: t.description ?? '',
      enabled: enabled.includes(t.name),
    })),
  }
}

export const DashboardProfiles = ({ tenantId, initialProfiles, tools }: DashboardProfilesProps) => {
  const { toast } = useToast()
  const activeTools = tools.filter((t) => t.is_active)

  const [profile, setProfile] = useState<BackendAgentProfile | null>(initialProfiles[0] ?? null)
  const [activeConfig, setActiveConfig] = useState<BackendAgentConfig | null>(null)
  const [draftConfig, setDraftConfig] = useState<BackendAgentConfig | null>(null)
  const [configsLoading, setConfigsLoading] = useState(!!initialProfiles[0])
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: buildDefaults(profile, null, activeTools),
  })

  const { fields: specialties, append: appendSpecialty, remove: removeSpecialty } = useFieldArray({
    control: form.control,
    name: 'allowed_specialties',
  })
  const { fields: locations, append: appendLocation, remove: removeLocation } = useFieldArray({
    control: form.control,
    name: 'allowed_locations',
  })

  // Fetch configs whenever the selected profile changes
  useEffect(() => {
    if (!profile) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfigsLoading(true)
    Promise.all([
      getAgentConfigs(tenantId, profile.id),
      getActiveAgentConfig(tenantId, profile.id),
    ])
      .then(([configs, active]) => {
        setActiveConfig(active)
        setDraftConfig(configs.find((c) => c.status === 'draft') ?? null)
      })
      .catch(() => {
        setActiveConfig(null)
        setDraftConfig(null)
      })
      .finally(() => setConfigsLoading(false))
  }, [tenantId, profile?.id])

  // Reset form whenever profile or configs load
  useEffect(() => {
    form.reset(buildDefaults(profile, draftConfig ?? activeConfig, activeTools))
  }, [profile, draftConfig, activeConfig])

  const onSubmit = async (formData: FormValues) => {
    setSaving(true)
    try {
      const enabledTools = formData.tool_permissions
        .filter((t) => t.enabled)
        .map((t) => ({ tool_name: t.name, constraints: {} }))

      if (enabledTools.length === 0) {
        toast({ variant: 'destructive', title: 'Enable at least one tool' })
        setSaving(false)
        return
      }

      let currentProfile = profile

      const specialties = formData.allowed_specialties.map((s) => s.value).filter(Boolean)
      const locations = formData.allowed_locations.map((l) => l.value).filter(Boolean)

      if (!currentProfile) {
        currentProfile = await createAgentProfile(tenantId, {
          name: formData.name || 'Default Profile',
          allowed_specialties: specialties,
          allowed_locations: locations,
        })
        setProfile(currentProfile)
      } else {
        const updated = await updateAgentProfile(tenantId, currentProfile.id, {
          name: formData.name,
          allowed_specialties: specialties,
          allowed_locations: locations,
        })
        setProfile(updated)
      }

      const base = activeConfig
      if (draftConfig) {
        const updated = await updateAgentConfig(tenantId, currentProfile.id, draftConfig.id, {
          tool_permissions: enabledTools,
        })
        setDraftConfig(updated)
      } else {
        const newDraft = await createAgentConfig(tenantId, currentProfile.id, {
          conversation_policy: base?.conversation_policy ?? { greeting: 'Hola, soy tu asistente.', max_turns: 20, language: 'es' },
          escalation_rules: base?.escalation_rules ?? { triggers: ['patient_frustrated'], target: 'human_agent' },
          tool_permissions: enabledTools,
          llm_params: base?.llm_params ?? { model: 'gpt-4o', temperature: 0.3, max_tokens: 1024, system_prompt: 'Eres un asistente de agendamiento médico.' },
          channel_format_rules: base?.channel_format_rules ?? null,
        })
        setDraftConfig(newDraft)
      }

      toast({ title: 'Draft saved' })
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving',
        description: e?.response?.data?.error ?? 'Please try again',
      })
    }
    setSaving(false)
  }

  const onActivate = async () => {
    if (!profile || !draftConfig) return
    setSaving(true)
    try {
      const activated = await activateAgentConfig(tenantId, profile.id, draftConfig.id)
      setActiveConfig(activated)
      setDraftConfig(null)
      toast({ title: 'Configuration activated' })
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error activating',
        description: e?.response?.data?.error ?? 'Please try again',
      })
    }
    setSaving(false)
  }

  if (configsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Profiles" description="Configure the business rules and technical settings for your AI agents." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-64 w-full" /></div>
          <div className="lg:col-span-1"><Skeleton className="h-64 w-full" /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Profiles"
        description="Configure the business rules and technical settings for your AI agents."
        actions={
          profile ? (
            <Badge variant="outline" className="gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              {profile.name}
              {draftConfig ? (
                <span className="ml-1 text-xs text-amber-600">· draft pending</span>
              ) : activeConfig ? (
                <span className="ml-1 text-xs text-emerald-600">· v{activeConfig.version} active</span>
              ) : null}
            </Badge>
          ) : undefined
        }
      />

      <Card className="border-muted bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">What is this page?</CardTitle>
          <CardDescription>
            Edit the bot&apos;s &ldquo;personality&rdquo; for this tenant — which specialties it
            handles, which tools it can call, what escalation rules apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            An <strong>Agent Profile</strong> bundles: name, allowed specialties, locations,
            and escalation rules. Each tenant has one (Demo Hospital ships with &ldquo;Hospital
            base&rdquo;).
          </p>
          <p>
            An <strong>Agent Config</strong> is an immutable snapshot of the profile (system
            prompt, LLM params, tool permissions, channel rules). Only ONE config is{" "}
            <Badge variant="outline" className="ml-0.5 mr-0.5 px-1 py-0 text-[10px]">active</Badge>{" "}
            at a time — that&apos;s the one the bot uses.
          </p>
          <p>
            Changes here create a{" "}
            <Badge variant="outline" className="ml-0.5 mr-0.5 px-1 py-0 text-[10px]">draft</Badge>;
            clicking &ldquo;Activate configuration&rdquo; promotes the draft to active and the
            previous version becomes{" "}
            <Badge variant="outline" className="ml-0.5 mr-0.5 px-1 py-0 text-[10px]">archived</Badge>.
            The bot picks up the new config on the next turn.
          </p>
          <p>
            The <strong>Tools</strong> below come from the global registry (
            <code className="rounded bg-muted px-1 text-xs">/api/v1/tool-registry</code>). Toggle
            each one to include or exclude it from the next config&apos;s{" "}
            <code className="rounded bg-muted px-1 text-xs">tool_permissions</code>.
          </p>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>Define the agent&apos;s domain and business rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Allowed Specialties */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Allowed Specialties</h3>
                    <div className="space-y-2">
                      {specialties.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`allowed_specialties.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecialty(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSpecialty({ value: '' })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Specialty
                    </Button>
                  </div>

                  {/* Allowed Locations */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Allowed Locations</h3>
                    <div className="space-y-2">
                      {locations.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`allowed_locations.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendLocation({ value: '' })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Configuration (ACR)</CardTitle>
                  <CardDescription>Enable the tools this agent is allowed to use.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeTools.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active tools in registry.</p>
                  ) : (
                    form.getValues().tool_permissions.map((tool, index) => (
                      <FormField
                        key={tool.name}
                        control={form.control}
                        name={`tool_permissions.${index}.enabled`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FormLabel className="text-base">{tool.name}</FormLabel>
                                {field.value ? <Badge variant="success">Enabled</Badge> : null}
                              </div>
                              <FormDescription>{tool.description}</FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" variant="outline" disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={saving || !draftConfig}>Activate Configuration</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Activate this configuration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive the currently active version and replace it with this one.
                    The agent&apos;s production behavior will change immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onActivate}>Yes, activate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </Form>
    </div>
  )
}
