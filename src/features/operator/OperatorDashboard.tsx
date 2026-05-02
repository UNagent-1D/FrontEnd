'use client'

import { useCallback, useState } from "react"
import { MessageSquareText } from "lucide-react"

import { EmptyState } from "@/components/layout/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"

import { ActiveChat } from "./ActiveChat"
import { EscalationQueue } from "./EscalationQueue"

export const OperatorDashboard = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [])

  const handleCloseSession = useCallback(() => {
    setActiveSessionId(null)
  }, [])

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] flex-col">
      <PageHeader
        title="Operator Panel"
        description="Accept escalations and reply to conversations in real time."
      />

      <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-4">
        <div className="overflow-hidden rounded-xl border bg-background lg:col-span-1">
          <EscalationQueue onSelectSession={handleSelectSession} />
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
