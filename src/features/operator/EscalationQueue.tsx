'use client'

import { useCallback, useEffect, useState } from "react"
import { Inbox, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/layout/EmptyState"
import { getEscalations, acceptEscalation, type EscalationItem } from "@/api/apiService"
import { useToast } from "@/hooks/use-toast"

// The queue is polled rather than pushed: conversation-chat owns the
// escalation state and there is no websocket server. 2s keeps the lag
// under one render frame perception without hammering the API.
const POLL_MS = 2000

interface EscalationQueueProps {
  tenantId: string
  onSelectSession: (sessionId: string) => void
}

export const EscalationQueue = ({ tenantId, onSelectSession }: EscalationQueueProps) => {
  const { toast } = useToast()

  const [queue, setQueue] = useState<EscalationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [healthy, setHealthy] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // Skip when no tenant is selected — otherwise we'd send tenant_id=""
    // and the backend (or our own old "demo-tenant" slug) would return
    // garbage. The dashboard shows a "no tenant" empty state instead.
    if (!tenantId) {
      setQueue([])
      setLoading(false)
      return
    }
    try {
      const items = await getEscalations(tenantId)
      setQueue(items)
      setHealthy(true)
    } catch {
      setHealthy(false)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    refresh()
    if (!tenantId) return
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh, tenantId])

  const handleAccept = async (sessionId: string) => {
    setAcceptingId(sessionId)
    try {
      await acceptEscalation(sessionId)
      toast({ title: "Session accepted", description: "The conversation is yours." })
      setQueue((prev) => prev.filter((s) => s.session_id !== sessionId))
      onSelectSession(sessionId)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not accept the session. Another operator may have taken it.",
      })
      refresh()
    } finally {
      setAcceptingId(null)
    }
  }

  // The backend returns both unclaimed and claimed-but-open sessions; split
  // them so a reload (or another tab) can resume an in-progress conversation.
  const waiting = queue.filter((s) => s.state !== "operator_active")
  const active = queue.filter((s) => s.state === "operator_active")

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Escalation Queue</h2>
          <Badge variant={healthy ? "success" : "secondary"}>
            {healthy ? "Live" : "Offline"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {waiting.length} waiting
          {active.length > 0 ? ` · ${active.length} in progress` : ""}
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center p-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No conversations in queue."
            description="New escalations will appear here."
            className="mt-6"
          />
        ) : (
          <>
            {active.length > 0 && (
              <p className="px-1 text-xs font-medium uppercase text-muted-foreground">
                In progress
              </p>
            )}
            {active.map((s) => (
              <Card key={s.session_id} className="border-primary/40 transition-shadow hover:shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">
                    {s.end_user || `Session ${s.session_id.slice(-6)}`}
                  </CardTitle>
                  <CardDescription className="truncate">
                    {s.preview || "No messages"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => onSelectSession(s.session_id)}
                  >
                    Resume
                  </Button>
                </CardContent>
              </Card>
            ))}
            {active.length > 0 && waiting.length > 0 && (
              <p className="px-1 pt-2 text-xs font-medium uppercase text-muted-foreground">
                Waiting
              </p>
            )}
            {waiting.map((s) => (
              <Card key={s.session_id} className="transition-shadow hover:shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">
                    {s.end_user || `Session ${s.session_id.slice(-6)}`}
                  </CardTitle>
                  <CardDescription className="truncate">
                    {s.preview || "No messages"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button
                    className="w-full"
                    disabled={acceptingId === s.session_id}
                    onClick={() => handleAccept(s.session_id)}
                  >
                    {acceptingId === s.session_id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Attend"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
