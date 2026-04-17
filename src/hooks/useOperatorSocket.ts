import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

// This URL would come from environment variables in a real app
const CHAT_BASE = (import.meta.env.VITE_CHAT_API_URL as string | undefined) || 'http://localhost:8082/api/v1';
const SOCKET_URL = CHAT_BASE.replace(/\/api\/v1\/?$/, '');

// Define the events we expect to receive from the server
interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  'escalation-queue-update': (data: { queue: any[] }) => void; // Define a proper type for queue items later
  'new-message': (data: { sessionId: string; turn: any }) => void; // Define Turn type
}

// Define the events we can send to the server
interface ClientToServerEvents {
  'join-operator-room': (data: { tenantId: string }) => void;
  'operator-message': (data: { sessionId: string; text: string }) => void;
}

export const useOperatorSocket = () => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [escalationQueue, setEscalationQueue] = useState<any[]>([]);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    // Initialize the socket connection
    const socket = io(SOCKET_URL, {
      path: '/ws/operator',
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-operator-room', { tenantId: user.tenant_id });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('escalation-queue-update', (data) => {
      setEscalationQueue(data.queue);
    });

    // Clean up the connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  // Function to send a message from the operator
  const sendOperatorMessage = (sessionId: string, text: string) => {
    socketRef.current?.emit('operator-message', { sessionId, text });
  };

  return { isConnected, escalationQueue, sendOperatorMessage };
};
