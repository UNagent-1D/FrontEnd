import { useState } from "react"
import { Search, UserSearch } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/layout/EmptyState"

const mockEndUser = {
  id: "eu-12345",
  full_name: "Jessica Laverdetman",
  national_id: "123.456.789-0",
  cellphone: "+17863559966",
  email: "jess.laverdetman@email.com",
  is_active: true,
}

export const OperatorLookup = () => {
  const [searchType, setSearchType] = useState("cellphone")
  const [searchTerm, setSearchTerm] = useState("")
  const [foundUser, setFoundUser] = useState<typeof mockEndUser | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = () => {
    setSearched(true)
    if (searchTerm) setFoundUser(mockEndUser)
    else setFoundUser(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Lookup"
        description="Find end users by phone number or national ID within your tenant."
      />

      <Card>
        <CardHeader>
          <CardTitle>End User Lookup</CardTitle>
          <CardDescription>
            Enter a unique identifier to retrieve customer information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cellphone">Cell Phone</SelectItem>
                <SelectItem value="national-id">National ID</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={
                searchType === "cellphone" ? "+1786..." : "123.456..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="gap-2">
              <Search className="size-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched ? (
        foundUser ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {foundUser.full_name}
                <Badge variant={foundUser.is_active ? "success" : "secondary"}>
                  {foundUser.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>{foundUser.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    National ID
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {foundUser.national_id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {foundUser.cellphone}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={UserSearch}
            title="No user found"
            description="The API always returns 200 OK to prevent data enumeration — double-check the identifier and try again."
          />
        )
      ) : (
        <EmptyState
          icon={UserSearch}
          title="Search for a customer"
          description="Enter a phone number or national ID above to look up a customer profile."
        />
      )}
    </div>
  )
}
