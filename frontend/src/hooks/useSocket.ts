import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '../services/chatService';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// Singleton socket instance
let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socketInstance;
}

interface UseSocketOptions {
  conversationId: string | null;
  onNewMessage: (message: Message) => void;
  onMessageDeleted?: (data: { messageId: string }) => void;
}

export function useSocket({ conversationId, onNewMessage, onMessageDeleted }: UseSocketOptions) {
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;
  
  const onMessageDeletedRef = useRef(onMessageDeleted);
  onMessageDeletedRef.current = onMessageDeleted;

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();

    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (message: Message) => {
      onNewMessageRef.current(message);
    };
    
    const handleMessageDeleted = (data: { messageId: string }) => {
      onMessageDeletedRef.current?.(data);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.emit('leave_conversation', conversationId);
    };
  }, [conversationId]);

  const emit = useCallback((event: string, data: unknown) => {
    getSocket().emit(event, data);
  }, []);

  return { emit };
}
