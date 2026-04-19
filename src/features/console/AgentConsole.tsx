import { useState } from 'react';
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
import { Send } from 'lucide-react';
import type { StructuredLlmOutput } from '@/types';

// Mock trace data that simulates a tool_call action from the LLM
const mockToolCallTrace: StructuredLlmOutput = {
  action: "tool_call",
  message: {
    text: "Claro, déjame verificar los horarios disponibles para Cardiología.",
    tool: {
      tool_name: "get_doctor_schedule",
      parameters: {
        specialty: "Cardiology"
      }
    }
  }
};

// Mock trace data that simulates an escalate action from the LLM
const mockEscalateTrace: StructuredLlmOutput = {
  action: "escalate",
  message: {
    text: "Entiendo tu frustración. Permíteme conectarte con un operador humano para que pueda ayudarte mejor.",
    escalation: {
      reason: "angry",
      operator_note: "El usuario está molesto porque no encuentra una cita disponible en las próximas 24 horas."
    }
  }
};

export const AgentConsole = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: '¡Hola! ¿Cómo puedo ayudarte a agendar una cita hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [activeTrace, setActiveTrace] = useState<StructuredLlmOutput>(mockToolCallTrace);

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([...messages, { from: 'user', text: input }]);
    
    // Simulate the agent's response and trace update
    setTimeout(() => {
      // Alternate between mock traces for demonstration
      if (input.toLowerCase().includes("ayuda")) {
        setActiveTrace(mockEscalateTrace);
        setMessages(prev => [...prev, { from: 'bot', text: mockEscalateTrace.message.text }]);
      } else {
        setActiveTrace(mockToolCallTrace);
        setMessages(prev => [...prev, { from: 'bot', text: mockToolCallTrace.message.text }]);
      }
    }, 800);
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Consola de Pruebas del Agente</h1>
        <p className="text-muted-foreground">
          Interactúe con el agente y observe su proceso de pensamiento interno en tiempo real.
        </p>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Conversational Module */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Chat en Vivo</CardTitle>
            <CardDescription>Simule una conversación con el agente de IA. Escriba 'ayuda' para simular una escalación.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/20">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-lg ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu mensaje..."
              />
              <Button onClick={handleSend}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Trace Viewer Module */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Visor de Trazas (Salida Estructurada del LLM)</CardTitle>
            <CardDescription>Telemetría en tiempo real de las acciones del agente.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4 border rounded-md bg-gray-900 text-white font-mono text-xs">
              <pre>{JSON.stringify(activeTrace, null, 2)}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
