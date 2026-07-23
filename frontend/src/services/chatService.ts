import api from '../utils/api';

export interface Participant {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface ConversationItem {
  itemId?: string;
  itemType?: string;
  itemName?: string;
  itemImage?: string;
}

export interface Conversation {
  _id: string;
  participants: Participant[];
  otherParticipant: Participant;
  item?: ConversationItem;
  lastMessage: string;
  lastMessageAt: string;
  myUnread: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: Participant;
  text: string;
  imageUrl?: string;
  read: boolean;
  createdAt: string;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export const getConversations = async (
  page = 1,
  limit = 20
): Promise<{ conversations: Conversation[]; hasNextPage: boolean; total: number }> => {
  const res = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
  return {
    conversations: res.data.data.conversations,
    hasNextPage: res.data.data.hasNextPage,
    total: res.data.data.total,
  };
};

export const getOrCreateConversation = async (payload: {
  recipientId: string;
  itemId?: string;
  itemType?: string;
  itemName?: string;
  itemImage?: string;
}): Promise<Conversation> => {
  const res = await api.post('/chat/conversations', payload);
  return res.data.data.conversation;
};

export const markConversationRead = async (conversationId: string): Promise<void> => {
  await api.patch(`/chat/conversations/${conversationId}/read`);
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/chat/conversations/messages/${messageId}`);
};

export const reportMessage = async (messageId: string, reason?: string): Promise<void> => {
  await api.post(`/chat/conversations/messages/${messageId}/report`, { reason });
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 50
): Promise<{ messages: Message[]; total: number }> => {
  const res = await api.get(
    `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
  );
  return res.data.data;
};

export const sendMessage = async (
  conversationId: string,
  text: string,
  image?: File
): Promise<Message> => {
  if (image) {
    const fd = new FormData();
    if (text) fd.append('text', text);
    fd.append('image', image);
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data.message;
  }
  
  const res = await api.post(`/chat/conversations/${conversationId}/messages`, { text });
  return res.data.data.message;
};

// ─── Unread count ─────────────────────────────────────────────────────────────

export const getTotalUnread = async (): Promise<number> => {
  const res = await api.get('/chat/unread');
  return res.data.data.totalUnread;
};
