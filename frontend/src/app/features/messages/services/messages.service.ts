import api from '../../../core/services/api.service';

export interface ConversationItem {
  id: number;
  applicationId?: number;
  jobId?: number;
  jobTitle: string;
  companyId?: number;
  companyName: string;
  candidateUserId: number;
  candidateName: string;
  candidateAvatar?: string;
  employerUserId: number;
  employerName: string;
  employerAvatar?: string;
  lastMessageAt: string;
  lastMessageContent: string;
  lastSenderId?: number;
  unreadCount: number;
}

export interface ChatMessageItem {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  isMine: boolean;
}

export interface ConversationDetail extends ConversationItem {
  messages: ChatMessageItem[];
}

export const messagesService = {
  getConversations: () => api.get('/messages/conversations'),
  getConversationById: (id: number) => api.get(`/messages/conversations/${id}`),
  getByApplicationId: (applicationId: number) => api.get(`/messages/by-application/${applicationId}`),
  sendMessage: (data: { conversationId?: number; applicationId?: number; content: string }) =>
    api.post('/messages/send', data),
  markAsRead: (id: number) => api.post(`/messages/conversations/${id}/read`),
  shortlistAndChat: (data: { applicationId: number; initialMessage?: string }) =>
    api.post('/messages/shortlist-and-chat', data)
};
