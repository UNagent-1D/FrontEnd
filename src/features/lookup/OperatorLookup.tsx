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
      <h1 className="text-3xl font-bold tracking-tight">Customer Lookup</h1>
      <p className="text-muted-foreground">
        Look up end users by their national ID or phone number within your tenant's scope.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>End User Lookup</CardTitle>
          <CardDescription>
            Enter a unique identifier to retrieve the customer's information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cellphone">Cell Phone</SelectItem>
                <SelectItem value="national-id">National ID</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={searchType === 'cellphone' ? "+1786..." : "123.456..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {foundUser ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {foundUser.full_name}</p>
                <p><strong>National ID:</strong> {foundUser.national_id}</p>
                <p><strong>Phone:</strong> {foundUser.cellphone}</p>
                <p><strong>Email:</strong> {foundUser.email}</p>
                <p><strong>Status:</strong> {foundUser.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No user found with the provided identifier.
                (Note: the API always returns 200 OK to prevent data enumeration.)
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
