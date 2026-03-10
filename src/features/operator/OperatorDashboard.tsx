import { useState } from 'react';
import { EscalationQueue } from './EscalationQueue';
import { ActiveChat } from './ActiveChat';

export const OperatorDashboard = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleCloseSession = () => {
    setActiveSessionId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-4rem)]">
      <div className="md:col-span-1 lg:col-span-1 border-r">
        <EscalationQueue onSelectSession={handleSelectSession} />
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        {activeSessionId ? (
          <ActiveChat sessionId={activeSessionId} onClose={handleCloseSession} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">Panel de Operadores</h2>
              <p className="text-muted-foreground mt-2">
                Seleccione una conversación de la cola de escalaciones para comenzar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
