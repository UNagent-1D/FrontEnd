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
import { useAuthStore } from "@/store/authStore"
import { useToast } from "@/hooks/use-toast"

// The queue is polled rather than pushed: conversation-chat owns the
// escalation state and there is no websocket server.
const POLL_MS = 4000

interface EscalationQueueProps {
  onSelectSession: (sessionId: string) => void
}

export const EscalationQueue = ({ onSelectSession }: EscalationQueueProps) => {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)
  // Telegram traffic is attributed to the demo tenant; fall back to it so an
  // app_admin (who has no tenant) still sees the Telegram escalations.
  const tenantId = user?.tenant_id || "demo-tenant"

  const [queue, setQueue] = useState<EscalationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [healthy, setHealthy] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
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
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

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

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Escalation Queue</h2>
          <Badge variant={healthy ? "success" : "secondary"}>
            {healthy ? "Live" : "Offline"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{queue.length} waiting</p>
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
          queue.map((s) => (
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
          ))
        )}
      </div>
    </div>
  )
}
