import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getSessionHistory, resolveEscalation } from '@/api/apiService';
import { useOperatorSocket } from '@/hooks/useOperatorSocket';
import type { Session, Turn } from '@/types';
import { Send, XCircle } from 'lucide-react';

interface ActiveChatProps {
  sessionId: string;
  onClose: () => void;
}

export const ActiveChat = ({ sessionId, onClose }: ActiveChatProps) => {
  const { toast } = useToast();
  const { sendOperatorMessage } = useOperatorSocket();
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await getSessionHistory(sessionId);
        setSession(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar el historial',
          description: 'No se pudo recuperar la conversación.',
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [sessionId, toast, onClose]);
  
  const handleSend = () => {
    if (message.trim()) {
      sendOperatorMessage(sessionId, message);
      // Here you would typically get a confirmation event via websocket
      // For now, we optimistically add the message to the UI
      const newTurn: Turn = { role: 'assistant', content: message, ts: new Date().toISOString() };
      setSession(prev => prev ? ({ ...prev, turns: [...prev.turns, newTurn] }) : null);
      setMessage('');
    }
  };

  const handleResolve = async (action: 'close' | 'bot_resume') => {
    try {
      await resolveEscalation(sessionId, action);
      toast({ title: 'Sesión resuelta', description: `La sesión ha sido marcada como resuelta.` });
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo resolver la sesión.' });
    }
  };


  if (isLoading) {
    return <div>Cargando conversación...</div>;
  }
  
  if (!session) {
    return <div>No se encontró la sesión.</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="font-semibold">Conversación Activa</h2>
          <p className="text-sm text-muted-foreground">
            con {session.context_envelope.end_user.full_name || 'Usuario'} ({sessionId.slice(-6)})
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><XCircle className="h-4 w-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4 bg-muted/20">
        <div className="space-y-4">
          {session.turns.map((turn, index) => (
            <div key={index} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-lg max-w-[70%] ${turn.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                <p className="text-xs text-muted-foreground/80 mb-1">{turn.role}</p>
                <p>{turn.content}</p>
                <p className="text-xs text-muted-foreground/60 text-right mt-1">{new Date(turn.ts).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Escribe tu respuesta..." />
          <Button onClick={handleSend}><Send className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => handleResolve('bot_resume')}>Resolver y Devolver al Bot</Button>
          <Button variant="destructive" onClick={() => handleResolve('close')}>Resolver y Cerrar</Button>
        </div>
      </div>
    </div>
  );
};
