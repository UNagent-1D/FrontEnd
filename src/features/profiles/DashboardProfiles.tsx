import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agentProfileSchema, type AgentProfile, type Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, PlusCircle } from "lucide-react";

// Mock data
const mockAgentProfile: any = {
  id: "d8f8b8a0...",
  name: "Agente de Agendamiento General",
  description: "Este perfil gestiona las citas para especialidades generales.",
  allowed_specialties: ["Cardiología", "Neurología"],
  allowed_locations: ["Bogotá Norte"],
  active_config: {
    tool_permissions: [{ tool_name: "list_doctors" }, { tool_name: "get_doctor_schedule" }],
  }
};

const mockToolRegistry: Tool[] = [
  { id: "tool-1", name: "list_doctors", description: "Lista los doctores disponibles.", is_active: true, openai_function_def: {} },
  { id: "tool-2", name: "get_doctor_schedule", description: "Obtiene el horario de un doctor.", is_active: true, openai_function_def: {} },
  { id: "tool-3", name: "book_appointment", description: "Agenda una nueva cita.", is_active: true, openai_function_def: {} },
  { id: "tool-4", name: "cancel_appointment", description: "Cancela una cita existente.", is_active: false, openai_function_def: {} },
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

  const onSubmit = (data: any) => {
    console.log("Form Submitted", data);
    alert("Perfil guardado. Revisa la consola.");
  };

  const onActivate = () => {
    console.log("Activating new config...");
    alert("Nueva configuración activada.");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Perfiles de Agente</h1>
      <p className="text-muted-foreground">
        Configure las reglas de negocio y la configuración técnica de sus agentes de IA.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Business Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Perfil de Negocio</CardTitle>
                  <CardDescription>Defina el dominio y las reglas de negocio del agente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name and Description fields here */}
                  
                  {/* Allowed Specialties */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Especialidades Permitidas</h3>
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
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir Especialidad
                    </Button>
                  </div>

                  {/* Allowed Locations */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Ubicaciones Permitidas</h3>
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
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ubicación
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
              {/* Technical Config Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración Técnica (ACR)</CardTitle>
                  <CardDescription>Habilite las herramientas que este agente puede utilizar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.getValues().tool_permissions.map((tool: any, index: number) => (
                    <FormField
                      key={tool.name}
                      control={form.control}
                      name={`tool_permissions.${index}.enabled`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">{tool.name}</FormLabel>
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
            <Button type="submit" variant="outline">Guardar Borrador</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>Activar Configuración</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro de que desea activar esta configuración?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción archivará la versión activa anterior y la reemplazará por la actual.
                    El comportamiento del agente en producción cambiará inmediatamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onActivate}>Sí, activar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </Form>
    </div>
  );
};
