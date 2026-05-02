'use client'

import { useForm, useFieldArray } from "react-hook-form";
import { type Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Trash2, PlusCircle } from "lucide-react";

// Mock data
const mockAgentProfile: any = {
  id: "d8f8b8a0...",
  name: "General Scheduling Agent",
  description: "This profile handles appointments for general specialties.",
  allowed_specialties: ["Cardiology", "Neurology"],
  allowed_locations: ["Bogota North"],
  active_config: {
    tool_permissions: [{ tool_name: "list_doctors" }, { tool_name: "get_doctor_schedule" }],
  }
};

const mockToolRegistry: Tool[] = [
  { id: "tool-1", name: "list_doctors", description: "List available doctors.", is_active: true, openai_function_def: {} },
  { id: "tool-2", name: "get_doctor_schedule", description: "Get a doctor's schedule.", is_active: true, openai_function_def: {} },
  { id: "tool-3", name: "book_appointment", description: "Book a new appointment.", is_active: true, openai_function_def: {} },
  { id: "tool-4", name: "cancel_appointment", description: "Cancel an existing appointment.", is_active: false, openai_function_def: {} },
];

export const DashboardProfiles = () => {
  const form = useForm({
    // resolver: zodResolver(agentProfileSchema),
    defaultValues: {
      ...mockAgentProfile,
      tool_permissions: mockToolRegistry
        .filter(tool => tool.is_active)
        .map(tool => ({
          name: tool.name,
          description: tool.description,
          enabled: mockAgentProfile.active_config.tool_permissions.some((p: any) => p.tool_name === tool.name),
        })),
    },
    mode: "onChange",
  });

  const { fields: specialties, append: appendSpecialty, remove: removeSpecialty } = useFieldArray({
    control: form.control,
    name: "allowed_specialties",
  });
  
  const { fields: locations, append: appendLocation, remove: removeLocation } = useFieldArray({
    control: form.control,
    name: "allowed_locations",
  });

  const onSubmit = (_data: any) => {
    // ACR service not yet available — no-op until backend is ready
  };

  const onActivate = () => {
    // ACR service not yet available — no-op until backend is ready
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Profiles"
        description="Configure the business rules and technical settings for your AI agents."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            {mockAgentProfile.name}
          </Badge>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Business Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>Define the agent&apos;s domain and business rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name and Description fields here */}
                  
                  {/* Allowed Specialties */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Allowed Specialties</h3>
                    <div className="space-y-2">
                      {specialties.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`allowed_specialties.${index}`}
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
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSpecialty('')}>
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
                            name={`allowed_locations.${index}`}
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
                    <Button type="button" variant="outline" size="sm" onClick={() => appendLocation('')}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
              {/* Technical Config Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Configuration (ACR)</CardTitle>
                  <CardDescription>Enable the tools this agent is allowed to use.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.getValues().tool_permissions.map((tool: any, index: number) => (
                    <FormField
                      key={tool.name}
                      control={form.control}
                      name={`tool_permissions.${index}.enabled`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-base">{tool.name}</FormLabel>
                              {field.value ? (
                                <Badge variant="success">Enabled</Badge>
                              ) : null}
                            </div>
                            <FormDescription>{tool.description}</FormDescription>
                          </div>
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="submit" variant="outline">Save Draft</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>Activate Configuration</Button>
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
  );
};
