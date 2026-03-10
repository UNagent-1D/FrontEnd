import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { useAuthStore } from "@/store/authStore"
import { useTenantStore } from "@/store/tenantStore"
import { useToast } from "@/hooks/use-toast"
import type { User, Tenant } from "@/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"

const loginSchema = z.object({
  email: z.string().email({ message: "La dirección de correo electrónico no es válida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

// --- Mock Data ---
const mockUsers: User[] = [
  { id: "user-app-admin", email: "appadmin@example.com", role: "app_admin", tenant_id: "" },
  { id: "user-tenant-admin", email: "tenantadmin@example.com", role: "tenant_admin", tenant_id: "tenant-123" },
  { id: "user-tenant-operator", email: "operator@example.com", role: "tenant_operator", tenant_id: "tenant-123" },
];

const mockTenant: Tenant = {
  id: "tenant-123",
  name: "Hospital San Ignacio",
  slug: "hospital-san-ignacio",
  branding_logo_url: "https://raw.githubusercontent.com/UN-AVT/Backend-project/main/src/assets/logo-hospital.png",
  branding_primary_color: "#2E75B6", // Blue
};
// --- End Mock Data ---


export function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const setTenant = useTenantStore((state) => state.setTenant)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleLogin = (user: User) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      setAuth("fake-jwt-token", user);
      
      if (user.tenant_id) {
        setTenant(mockTenant);
      } else {
        useTenantStore.getState().clearTenant();
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido. Rol: ${user.role}.`,
      });

      // --- CORRECTION START ---
      // Redirect based on role
      if (user.role === 'app_admin') {
        navigate("/admin/tenants");
      } else if (user.role === 'tenant_admin') {
        navigate("/dashboard/profiles");
      } else if (user.role === 'tenant_operator') {
        navigate("/operator/dashboard"); // The correct route for operators
      } else {
        // Fallback for any other roles
        navigate("/");
      }
      // --- CORRECTION END ---

    }, 500);
  };

  async function onSubmit(data: LoginFormValues) {
    const foundUser = mockUsers.find(u => u.email === data.email);
    if (foundUser && data.password === "password") {
      handleLogin(foundUser);
    } else {
      toast({
        variant: "destructive",
        title: "Credenciales inválidas",
        description: "Por favor, verifique su correo y contraseña.",
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Inicia sesión en tu cuenta</CardTitle>
          <CardDescription className="text-center">
            Ingresa tu correo y contraseña para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" type="email" disabled={isLoading} {...field} />
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input placeholder="password" type="password" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <Separator className="my-4" />

        <CardFooter className="flex flex-col space-y-2 text-center">
          <p className="text-sm text-muted-foreground mb-2">O inicia sesión con un clic (para pruebas)</p>
          <div className="grid grid-cols-3 gap-2 w-full">
            <Button variant="outline" onClick={() => handleLogin(mockUsers.find(u => u.role === 'app_admin')!)} disabled={isLoading}>
              App Admin
            </Button>
            <Button variant="outline" onClick={() => handleLogin(mockUsers.find(u => u.role === 'tenant_admin')!)} disabled={isLoading}>
              Tenant Admin
            </Button>
            <Button variant="outline" onClick={() => handleLogin(mockUsers.find(u => u.role === 'tenant_operator')!)} disabled={isLoading}>
              Operator
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
