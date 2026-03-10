import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const GlobalTenants = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Gestión de Inquilinos</h1>
      <p className="text-muted-foreground">
        Aprovisione, gestione y monitoree todos los inquilinos de la plataforma. (Solo app_admin)
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Lista Global de Inquilinos</CardTitle>
          <CardDescription>
            Esta tabla muestra todas las organizaciones activas y pendientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>La tabla de datos de inquilinos se implementará aquí.</p>
          {/* TanStack Table will go here */}
        </CardContent>
      </Card>
    </div>
  )
}
