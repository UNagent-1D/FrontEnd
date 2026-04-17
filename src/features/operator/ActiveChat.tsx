import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getSession, getSessionHistory, resolveEscalation } from '@/api/apiService';
import { useOperatorSocket } from '@/hooks/useOperatorSocket';
import type { SessionInfo, Turn } from '@/types';
import { Send, XCircle } from 'lucide-react';

interface ActiveChatProps {
  sessionId: string;
  onClose: () => void;
}

export const ActiveChat = ({ sessionId, onClose }: ActiveChatProps) => {
  const { toast } = useToast();
  const { sendOperatorMessage } = useOperatorSocket();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [info, history] = await Promise.all([
          getSession(sessionId),
          getSessionHistory(sessionId),
        ]);
        setSessionInfo(info);
        setTurns(history.turns);
      } catch (error) {
        console.error('[ActiveChat] fetch failed:', error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar la conversación',
          description: 'No se pudo recuperar los datos de la sesión.',
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!message.trim()) return;
    sendOperatorMessage(sessionId, message);
    const newTurn: Turn = { role: 'assistant', content: message, ts: new Date().toISOString() };
    setTurns((prev) => [...prev, newTurn]);
    setMessage('');
  };

  const handleResolve = async (action: 'close' | 'bot_resume') => {
    try {
      await resolveEscalation(sessionId, action);
      toast({ title: 'Sesión resuelta', description: 'La sesión ha sido marcada como resuelta.' });
      onClose();
    } catch (error) {
      console.error('[ActiveChat] handleResolve failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo resolver la sesión.' });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Cargando conversación...</div>;
  }

  if (!sessionInfo) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No se encontró la sesión.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="font-semibold">Conversación Activa</h2>
          <p className="text-sm text-muted-foreground">
            Usuario: {sessionInfo.end_user_id} · Canal: {sessionInfo.channel_type} · Estado: {sessionInfo.state}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 bg-muted/20">
        <div className="space-y-4">
          {turns.map((turn, index) => (
            <div key={index} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-lg max-w-[70%] ${turn.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                <p className="text-xs text-muted-foreground/80 mb-1">{turn.role}</p>
                <p>{turn.content}</p>
                <p className="text-xs text-muted-foreground/60 text-right mt-1">
                  {new Date(turn.ts).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {turns.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Sin mensajes en esta sesión.</p>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-3">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu respuesta..."
          />
          <Button onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => handleResolve('bot_resume')}>
            Resolver y Devolver al Bot
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => handleResolve('close')}>
            Resolver y Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
