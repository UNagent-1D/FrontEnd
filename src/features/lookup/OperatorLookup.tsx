import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

// Mock user data based on the end_users table schema
const mockEndUser = {
  id: "eu-12345",
  full_name: "Jessica Laverdetman",
  national_id: "123.456.789-0",
  cellphone: "+17863559966",
  email: "jess.laverdetman@email.com",
  is_active: true,
};

export const OperatorLookup = () => {
  const [searchType, setSearchType] = useState("cellphone");
  const [searchTerm, setSearchTerm] = useState("");
  const [foundUser, setFoundUser] = useState<typeof mockEndUser | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    // Simulate API call - always returns HTTP 200
    // In a real app, this would call the /lookup/... endpoint
    setSearched(true);
    if (searchTerm) {
      // Simulate finding the user
      setFoundUser(mockEndUser);
    } else {
      // Simulate not finding the user
      setFoundUser(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Búsqueda de Pacientes</h1>
      <p className="text-muted-foreground">
        Busque usuarios finales por su ID nacional o número de teléfono dentro del alcance de su inquilino.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda de Usuario Final</CardTitle>
          <CardDescription>
            Ingrese un identificador único para recuperar la información del paciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cellphone">Teléfono Celular</SelectItem>
                <SelectItem value="national-id">ID Nacional</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder={searchType === 'cellphone' ? "+1786..." : "123.456..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" /> Buscar</Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            {foundUser ? (
              <div className="space-y-2">
                <p><strong>Nombre:</strong> {foundUser.full_name}</p>
                <p><strong>ID Nacional:</strong> {foundUser.national_id}</p>
                <p><strong>Teléfono:</strong> {foundUser.cellphone}</p>
                <p><strong>Email:</strong> {foundUser.email}</p>
                <p><strong>Estado:</strong> {foundUser.is_active ? 'Activo' : 'Inactivo'}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No se encontró ningún usuario con el identificador proporcionado. 
                (Nota: La API siempre devuelve 200 OK para evitar la enumeración de datos).
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
