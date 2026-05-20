'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { Send, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  getSessionHistory,
  getSessionState,
  resolveEscalation,
  sendOperatorMessage,
} from "@/api/apiService"
import type { Turn } from "@/types"
import { cn } from "@/lib/utils"

// History and state are polled so the operator sees the user's incoming
// messages without a websocket.
const POLL_MS = 3000

interface ActiveChatProps {
  sessionId: string
  onClose: () => void
}

function turnLabel(role: string): { label: string; fallback: string; isOperator: boolean } {
  if (role === "user") return { label: "User", fallback: "U", isOperator: false }
  if (role === "assistant") return { label: "Operator / Bot", fallback: "Op", isOperator: true }
  if (role === "tool") return { label: "Tool", fallback: "Tl", isOperator: false }
  return { label: role, fallback: role.slice(0, 2).toUpperCase(), isOperator: false }
}

export const ActiveChat = ({ sessionId, onClose }: ActiveChatProps) => {
  const { toast } = useToast()
  const [turns, setTurns] = useState<Turn[]>([])
  const [state, setState] = useState<string>("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [history, st] = await Promise.all([
        getSessionHistory(sessionId),
        getSessionState(sessionId).catch(() => ""),
      ])
      setTurns(history.turns ?? [])
      if (st) setState(st)
    } catch (error) {
      console.error("[ActiveChat] refresh failed:", error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    setIsLoading(true)
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [turns.length])

  const handleSend = async () => {
    const text = message.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await sendOperatorMessage(sessionId, text)
      setMessage("")
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: text, ts: new Date().toISOString() },
      ])
    } catch (error) {
      console.error("[ActiveChat] send failed:", error)
      toast({
        variant: "destructive",
        title: "Could not send",
        description: "The session must be active with an operator.",
      })
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async (action: "close" | "bot_resume") => {
    try {
      await resolveEscalation(sessionId, action)
      toast({ title: "Session resolved" })
      onClose()
    } catch (error) {
      console.error("[ActiveChat] resolve failed:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not resolve the session.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="flex-1 space-y-3 p-6">
          <Skeleton className="h-14 w-3/4" />
          <Skeleton className="ml-auto h-14 w-2/3" />
          <Skeleton className="h-14 w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <h2 className="font-semibold">Active conversation</h2>
          <p className="truncate text-sm text-muted-foreground">{sessionId}</p>
        </div>
        <div className="flex items-center gap-2">
          {state && <Badge variant="outline">{state}</Badge>}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <XCircle className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea viewportRef={viewportRef} className="flex-1 bg-muted/20">
        <div className="space-y-4 p-4">
          {turns.map((turn, index) => {
            const { label, fallback, isOperator } = turnLabel(turn.role)
            return (
              <div
                key={index}
                className={cn(
                  "flex items-end gap-2",
                  isOperator ? "justify-end" : "justify-start"
                )}
              >
                {!isOperator && (
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="text-[10px] font-semibold">
                      {fallback}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
                    isOperator
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border"
                  )}
                >
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide opacity-70">
                    {label}
                  </p>
                  <p>{turn.content}</p>
                  <p className="mt-1 text-right text-[10px] opacity-60">
                    {new Date(turn.ts).toLocaleTimeString()}
                  </p>
                </div>
                {isOperator && (
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                      Op
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
          {turns.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No messages in this session.
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="space-y-3 border-t bg-background p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your reply..."
          />
          <Button onClick={handleSend} aria-label="Send" disabled={sending}>
            <Send className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleResolve("bot_resume")}
          >
            Resolve and return to bot
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => handleResolve("close")}
          >
            Resolve and close
          </Button>
        </div>
      </div>
    </div>
  )
}
