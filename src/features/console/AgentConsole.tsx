'use client'

import { useEffect, useRef, useState } from "react"
import { Copy, Send, Star } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { useToast } from "@/hooks/use-toast"

import { ORCH_URL } from "@/api/axios"
import { postChatMessage, submitCsat } from "@/api/apiService"
import { useAuthStore } from "@/store/authStore"
import { getInitials } from "@/lib/user"
import { cn } from "@/lib/utils"

type ChatMessage = { from: "user" | "bot"; text: string }

export const AgentConsole = () => {
  const user = useAuthStore((s) => s.user)
  const tenantId = user?.tenant_id || "demo-tenant"
  const { toast } = useToast()

  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Hi! How can I help you today?" },
  ])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastDownstream, setLastDownstream] = useState<unknown>(null)
  const [connected, setConnected] = useState(false)
  const [csatScore, setCsatScore] = useState<number | null>(null)
  const [csatHover, setCsatHover] = useState<number | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [now, setNow] = useState<number>(Date.now())
  const esRef = useRef<EventSource | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)

  // Drive the cooldown countdown only while it is active.
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  useEffect(() => {
    if (!sessionId) return

    const url = `${ORCH_URL}/v1/chat/stream?session_id=${encodeURIComponent(sessionId)}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as { kind: string; text: string }
        if (data.kind === "assistant" && data.text) {
          setMessages((prev) => [...prev, { from: "bot", text: data.text }])
        }
      } catch {
        /* keep-alive comment */
      }
    }

    return () => {
      es.close()
      esRef.current = null
      setConnected(false)
    }
  }, [sessionId])

  useEffect(() => {
    const el = scrollViewportRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { from: "user", text }])
    setInput("")

    try {
      const resp = await postChatMessage(tenantId, text, sessionId ?? undefined)
      setLastDownstream(resp)
      if (resp.session_id && resp.session_id !== sessionId) {
        setSessionId(resp.session_id)
      }
      const replyText = resp.message?.text?.trim()
      if (replyText) {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.from === "bot" && last.text === replyText) return prev
          return [...prev, { from: "bot", text: replyText }]
        })
      }
    } catch (err) {
      const retryAfter = (err as { retryAfterSecs?: number })?.retryAfterSecs
      if (retryAfter && retryAfter > 0) {
        setCooldownUntil(Date.now() + retryAfter * 1000)
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `Demasiadas solicitudes. Espere ${retryAfter} s antes de reintentar.`,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "Failed to reach the orchestrator." },
        ])
      }
      setLastDownstream({ error: String(err) })
    }
  }

  const handleCopyJson = async () => {
    if (!lastDownstream) return
    await navigator.clipboard.writeText(JSON.stringify(lastDownstream, null, 2))
    toast({ title: "JSON copied" })
  }

  const handleCsatClick = async (score: 1 | 2 | 3 | 4 | 5) => {
    if (!sessionId || csatScore !== null) return
    try {
      await submitCsat(tenantId, score, sessionId)
      setCsatScore(score)
      toast({ title: "Thanks for the feedback" })
    } catch {
      toast({ title: "Couldn't submit rating", variant: "destructive" })
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] flex-col">
      <PageHeader
        title="Agent Console"
        description="Messages route through chat-orch; replies stream over SSE."
        actions={
          <>
            {sessionId ? (
              <Badge variant="outline" className="font-mono">
                {sessionId.slice(-10)}
              </Badge>
            ) : (
              <Badge variant="secondary">No active session</Badge>
            )}
            <Badge variant={connected ? "success" : "secondary"}>
              {connected ? "SSE connected" : "SSE idle"}
            </Badge>
          </>
        }
      />

      <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Live Chat</CardTitle>
            <CardDescription>
              Real-time conversation with the agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <ScrollArea
              viewportRef={scrollViewportRef}
              className="flex-1 px-4"
            >
              <div className="space-y-4 py-4">
                {messages.map((msg, index) => {
                  const isUser = msg.from === "user"
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-end gap-2",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isUser && (
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.text}
                      </div>
                      {isUser && (
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="text-[10px] font-semibold">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            {sessionId && (
              <div className="mt-2 flex items-center gap-2 border-t bg-background px-3 pt-2">
                <span className="text-xs text-muted-foreground">
                  How did we do?
                </span>
                {csatScore !== null ? (
                  <span className="text-xs text-muted-foreground">
                    Thanks for the feedback
                  </span>
                ) : (
                  <div className="flex items-center gap-0.5">
                    {([1, 2, 3, 4, 5] as const).map((n) => {
                      const active = (csatHover ?? 0) >= n
                      return (
                        <button
                          key={n}
                          type="button"
                          onMouseEnter={() => setCsatHover(n)}
                          onMouseLeave={() => setCsatHover(null)}
                          onClick={() => handleCsatClick(n)}
                          aria-label={`Rate ${n} out of 5`}
                          className="p-0.5 text-muted-foreground transition-colors hover:text-yellow-500"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              active && "fill-yellow-500 text-yellow-500"
                            )}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="sticky bottom-0 flex gap-2 border-t bg-background p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
              />
              <Button
                onClick={handleSend}
                aria-label="Send"
                disabled={cooldownLeft > 0}
                title={cooldownLeft > 0 ? `Espere ${cooldownLeft}s` : undefined}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
            <div>
              <CardTitle>Downstream response</CardTitle>
              <CardDescription>
                Raw JSON returned by the orchestrator.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyJson}
              disabled={!lastDownstream}
              className="gap-2"
            >
              <Copy className="size-3.5" />
              Copy JSON
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0">
            <ScrollArea className="h-full rounded-md border bg-zinc-950 font-mono text-xs text-zinc-50">
              <pre className="p-4">
                {lastDownstream
                  ? JSON.stringify(lastDownstream, null, 2)
                  : "// no response yet"}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
