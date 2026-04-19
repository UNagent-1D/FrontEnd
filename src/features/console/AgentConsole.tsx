import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { ORCH_URL } from '@/api/axios';
import { postChatMessage } from '@/api/apiService';
import { useAuthStore } from '@/store/authStore';

type ChatMessage = { from: 'user' | 'bot'; text: string };

export const AgentConsole = () => {
  const tenantId = useAuthStore((s) => s.user?.tenant_id) || 'demo-tenant';
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Hi! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastDownstream, setLastDownstream] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Open / re-open the SSE stream whenever we have a session id.
  useEffect(() => {
    if (!sessionId) return;

    const url = `${ORCH_URL}/v1/chat/stream?session_id=${encodeURIComponent(sessionId)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as { kind: string; text: string };
        if (data.kind === 'assistant' && data.text) {
          setMessages((prev) => [...prev, { from: 'bot', text: data.text }]);
        }
      } catch {
        // Non-JSON (e.g. keep-alive comments) — ignore.
      }
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [sessionId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setInput('');

    try {
      const resp = await postChatMessage(tenantId, text, sessionId ?? undefined);
      setLastDownstream(resp);
      if (resp.session_id && resp.session_id !== sessionId) {
        setSessionId(resp.session_id);
      }
      // If SSE hasn't flushed yet (or the subscriber opens late), surface the
      // reply from the synchronous POST response as a fallback.
      const replyText = resp.message?.text?.trim();
      if (replyText) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.from === 'bot' && last.text === replyText) return prev;
          return [...prev, { from: 'bot', text: replyText }];
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Failed to reach the orchestrator.' },
      ]);
      setLastDownstream({ error: String(err) });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Agent Test Console</h1>
        <p className="text-muted-foreground">
          Messages go to <code>chat-orch</code>; replies stream over SSE.{' '}
          {sessionId ? (
            <span>
              Session: <code>{sessionId}</code> · SSE {connected ? '✓' : '…'}
            </span>
          ) : (
            <span>No active session yet.</span>
          )}
        </p>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Live Chat</CardTitle>
            <CardDescription>
              Real-time conversation with the agent. The same bot that handles Telegram replies here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/20">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        msg.from === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
              />
              <Button onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Last downstream response</CardTitle>
            <CardDescription>
              Raw JSON payload returned by the orchestrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4 border rounded-md bg-gray-900 text-white font-mono text-xs">
              <pre>{lastDownstream ? JSON.stringify(lastDownstream, null, 2) : '// no response yet'}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
