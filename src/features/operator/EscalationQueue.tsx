import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOperatorSocket } from '@/hooks/useOperatorSocket';
import { acceptEscalation } from '@/api/apiService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EscalationQueueProps {
  onSelectSession: (sessionId: string) => void;
}

export const EscalationQueue = ({ onSelectSession }: EscalationQueueProps) => {
  const { isConnected, escalationQueue } = useOperatorSocket();
  const { toast } = useToast();
  const [devSessionId, setDevSessionId] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  const handleAccept = async (sessionId: string) => {
    try {
      await acceptEscalation(sessionId);
      toast({ title: 'Session accepted', description: 'The conversation is now yours.' });
      onSelectSession(sessionId);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not accept the session. Another operator may have already taken it.',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Escalation Queue</h2>
        <p className="text-sm text-muted-foreground">
          {isConnected ? `Connected` : 'Disconnected'} - {escalationQueue.length} waiting
        </p>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {escalationQueue.length === 0 ? (
           <p className="text-sm text-muted-foreground text-center p-4">No conversations waiting.</p>
        ) : (
           escalationQueue.map((session) => (
            <Card key={session.id}>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Session: {session.id.slice(-6)}</CardTitle>
                <CardDescription>User: {session.user_name || 'Unknown'}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button className="w-full" onClick={() => handleAccept(session.id)}>Attend</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Dev shortcut: load session by ID manually (WebSocket not available yet) */}
      <div className="p-3 border-t space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Dev — load session by ID</p>
        <Input
          placeholder="sess_test-001"
          value={devSessionId}
          onChange={(e) => setDevSessionId(e.target.value)}
          className="text-xs h-8"
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          disabled={devLoading}
          onClick={async () => {
            if (!devSessionId) return;
            setDevLoading(true);
            try {
              await acceptEscalation(devSessionId);
            } catch {
              // Accept may fail if session is already operator_active or wrong state — load anyway
            } finally {
              setDevLoading(false);
            }
            onSelectSession(devSessionId);
          }}
        >
          {devLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept and load session'}
        </Button>
      </div>
    </div>
  );
};
