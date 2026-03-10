import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dataSourceSchema, type DataSource } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";

// Mock data for initial state
const mockDataSources: DataSource[] = [
  {
    id: "ds-1",
    name: "Hospital Mock API",
    base_url: "https://mock-hospital-api.internal",
    route_configs: {
      "list_doctors": { "method": "GET", "path": "/doctors" },
      "book_appointment": { "method": "POST", "path": "/appointments" },
    },
  }
];

// Helper type for using useFieldArray with a dictionary
type RouteConfigArrayItem = { id: string; keyName: string; method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string; };

export const DataSourcesManager = () => {
  // In a real app, you'd fetch this data via TanStack Query
  const [dataSources] = useState(mockDataSources);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Fuentes de Datos</h1>
      <p className="text-muted-foreground">
        Configure los puntos de conexión para sistemas externos que el agente puede consultar.
      </p>
      {dataSources.map((ds) => (
        <DataSourceForm key={ds.id} dataSource={ds} />
      ))}
    </div>
  );
};

// A dedicated form component for a single data source
const DataSourceForm = ({ dataSource }: { dataSource: DataSource }) => {
  // We transform the route_configs object into an array for useFieldArray
  const initialRoutes = Object.entries(dataSource.route_configs).map(([key, value], index) => ({
    id: `${index}`,
    keyName: key,
    method: value.method,
    path: value.path,
  }));
  
  const form = useForm({
    // resolver: zodResolver(dataSourceSchema), // Complex resolver needed for the transformation
    defaultValues: {
      ...dataSource,
      routes: initialRoutes,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "routes",
  });

  const onSubmit = (data: any) => {
    // Transform the array back into a dictionary before submitting
    const route_configs = data.routes.reduce((acc: any, route: RouteConfigArrayItem) => {
      acc[route.keyName] = { method: route.method, path: route.path };
      return acc;
    }, {});

    const finalData = { ...dataSource, ...data, route_configs };
    delete finalData.routes;

    console.log("Form Submitted", JSON.stringify(finalData, null, 2));
    alert("Fuente de datos guardada. Revisa la consola.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dataSource.name}</CardTitle>
        <CardDescription>Edite la URL base y las rutas para esta fuente de datos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               {/* Form fields for name and base_url */}
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Configuración de Rutas</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-10 gap-2 items-end p-2 border rounded-md">
                   <FormField
                    control={form.control}
                    name={`routes.${index}.keyName`}
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel>Operación</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`routes.${index}.method`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                         <FormLabel>Método</FormLabel>
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
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`routes.${index}.path`}
                    render={({ field }) => (
                       <FormItem className="col-span-4">
                        <FormLabel>Ruta</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                       </FormItem>
                    )}
                  />
                   <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="col-span-1">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               <Button type="button" variant="outline" onClick={() => append({ id: `${fields.length}`, keyName: '', method: 'GET', path: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" />Añadir Ruta
              </Button>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
