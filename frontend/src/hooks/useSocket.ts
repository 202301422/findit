import { useEffect, useRef, useCallback } from 'react';
import type { Message } from '../services/chatService';
import { connectSocket, getSocket, setSocketAuthToken } from '../utils/socketClient';

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

    setSocketAuthToken(localStorage.getItem('accessToken'));
    const socket = connectSocket();

    const handleSocketError = (payload: { message?: string }) => {
      if (payload?.message) {
        console.error(payload.message);
      }
    };

    socket.emit('join_conversation', { conversationId }, (response: { success?: boolean; message?: string }) => {
      if (!response?.success && response?.message) {
        console.error(response.message);
      }
    });

    const handleNewMessage = (message: Message) => {
      onNewMessageRef.current(message);
    };
    
    const handleMessageDeleted = (data: { messageId: string }) => {
      onMessageDeletedRef.current?.(data);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('socket_error', handleSocketError);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('socket_error', handleSocketError);
      socket.emit('leave_conversation', conversationId);
    };
  }, [conversationId]);

  const emit = useCallback((event: string, data: unknown) => {
    getSocket().emit(event, data);
  }, []);

  return { emit };
}
