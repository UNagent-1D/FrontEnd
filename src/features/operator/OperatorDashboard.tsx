'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { MessageSquareText } from "lucide-react"

import { EmptyState } from "@/components/layout/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"

import { useAuthStore } from "@/store/authStore"

import { ActiveChat } from "./ActiveChat"
import { EscalationQueue } from "./EscalationQueue"

// Single-tenant demo: pin everyone to Demo Hospital. Override via env when
// a second tenant lands and the picker needs to come back. Drop the picker
// UI for now — the old "demo-tenant" slug fallback caused empty queues.
const DEMO_HOSPITAL_TENANT_ID =
  process.env.NEXT_PUBLIC_DEMO_HOSPITAL_TENANT_ID ??
  "ce5ac1c5-9b16-486a-b091-5468d232a4b8"

export const OperatorDashboard = () => {
  const user = useAuthStore((s) => s.user)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // tenant_admin / tenant_operator: JWT-pinned. app_admin: fallback to demo.
  // Both branches resolve to the same UUID today since demo is the only tenant.
  const tenantId = useMemo(
    () => user?.tenant_id || DEMO_HOSPITAL_TENANT_ID,
    [user?.tenant_id],
  )

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [])

  const handleCloseSession = useCallback(() => {
    setActiveSessionId(null)
  }, [])

  useEffect(() => {
    setActiveSessionId(null)
  }, [tenantId])

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] flex-col">
      <PageHeader
        title="Operator Panel"
        description="Accept escalations and reply to conversations in real time."
        actions={
          <Badge variant="secondary" className="font-normal">
            Demo Hospital
          </Badge>
        }
      />

      <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-4">
        <div className="overflow-hidden rounded-xl border bg-background lg:col-span-1">
          <EscalationQueue
            tenantId={tenantId}
            onSelectSession={handleSelectSession}
          />
        </div>
        <div className="overflow-hidden rounded-xl border bg-background lg:col-span-3">
          {activeSessionId ? (
            <ActiveChat
              sessionId={activeSessionId}
              onClose={handleCloseSession}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState
                icon={MessageSquareText}
                title="No conversation selected"
                description="Pick a session from the queue on the left to start replying."
                className="border-0 bg-transparent"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
