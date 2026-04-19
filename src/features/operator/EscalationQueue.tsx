import { useState } from "react"
import { Inbox, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/layout/EmptyState"
import { useOperatorSocket } from "@/hooks/useOperatorSocket"
import { acceptEscalation } from "@/api/apiService"
import { useToast } from "@/hooks/use-toast"

interface EscalationQueueProps {
  onSelectSession: (sessionId: string) => void
}

export const EscalationQueue = ({ onSelectSession }: EscalationQueueProps) => {
  const { isConnected, escalationQueue } = useOperatorSocket()
  const { toast } = useToast()
  const [devSessionId, setDevSessionId] = useState("")
  const [devLoading, setDevLoading] = useState(false)

  const handleAccept = async (sessionId: string) => {
    try {
      await acceptEscalation(sessionId)
      toast({
        title: "Session accepted",
        description: "The conversation is now yours.",
      })
      onSelectSession(sessionId)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Could not accept the session. Another operator may have taken it.",
      })
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Escalation Queue</h2>
          <Badge variant={isConnected ? "success" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {escalationQueue.length} waiting
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {escalationQueue.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No conversations waiting"
            description="New escalations will appear here in real time."
            className="mt-6"
          />
        ) : (
          escalationQueue.map((session) => (
            <Card
              key={session.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">
                  Session {session.id.slice(-6)}
                </CardTitle>
                <CardDescription className="truncate">
                  {session.user_name || "Unknown user"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleAccept(session.id)}
                >
                  Attend
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <details className="border-t px-4 py-3 text-xs text-muted-foreground [&_summary]:cursor-pointer">
        <summary className="font-medium">Dev tools</summary>
        <div className="mt-3 space-y-2">
          <p>Load a session by id (WebSocket not yet wired).</p>
          <Input
            placeholder="sess_test-001"
            value={devSessionId}
            onChange={(e) => setDevSessionId(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            disabled={devLoading}
            onClick={async () => {
              if (!devSessionId) return
              setDevLoading(true)
              try {
                await acceptEscalation(devSessionId)
              } catch {
                /* accept can fail if session is already active */
              } finally {
                setDevLoading(false)
              }
              onSelectSession(devSessionId)
            }}
          >
            {devLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              "Accept and load session"
            )}
          </Button>
        </div>
      </details>
    </div>
  )
}
