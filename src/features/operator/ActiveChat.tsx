'use client'

import { useEffect, useRef, useState } from "react"
import { Send, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  getSession,
  getSessionHistory,
  resolveEscalation,
} from "@/api/apiService"
import { useOperatorSocket } from "@/hooks/useOperatorSocket"
import type { SessionInfo, Turn } from "@/types"
import { cn } from "@/lib/utils"

interface ActiveChatProps {
  sessionId: string
  onClose: () => void
}

function turnLabel(role: string): { label: string; fallback: string } {
  if (role === "user") return { label: "User", fallback: "U" }
  if (role === "assistant") return { label: "Operator", fallback: "Op" }
  if (role === "bot") return { label: "Bot", fallback: "AI" }
  return { label: role, fallback: role.slice(0, 2).toUpperCase() }
}

export const ActiveChat = ({ sessionId, onClose }: ActiveChatProps) => {
  const { toast } = useToast()
  const { sendOperatorMessage } = useOperatorSocket()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [info, history] = await Promise.all([
          getSession(sessionId),
          getSessionHistory(sessionId),
        ])
        setSessionInfo(info)
        setTurns(history.turns)
      } catch (error) {
        console.error("[ActiveChat] fetch failed:", error)
        toast({
          variant: "destructive",
          title: "Error loading conversation",
          description: "Could not retrieve session data.",
        })
        onClose()
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [turns.length])

  const handleSend = () => {
    if (!message.trim()) return
    sendOperatorMessage(sessionId, message)
    const newTurn: Turn = {
      role: "assistant",
      content: message,
      ts: new Date().toISOString(),
    }
    setTurns((prev) => [...prev, newTurn])
    setMessage("")
  }

  const handleResolve = async (action: "close" | "bot_resume") => {
    try {
      await resolveEscalation(sessionId, action)
      toast({
        title: "Session resolved",
        description: "The session has been marked as resolved.",
      })
      onClose()
    } catch (error) {
      console.error("[ActiveChat] handleResolve failed:", error)
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

  if (!sessionInfo) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Session not found.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <h2 className="font-semibold">Active Conversation</h2>
          <p className="truncate text-sm text-muted-foreground">
            {sessionInfo.end_user_id} · {sessionInfo.channel_type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{sessionInfo.state}</Badge>
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
            const isOperator = turn.role === "assistant"
            const { label, fallback } = turnLabel(turn.role)
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
          <Button onClick={handleSend} aria-label="Send">
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
