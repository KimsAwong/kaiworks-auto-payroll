export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  content: string;
  type: 'text' | 'system' | 'broadcast';
  timestamp: Date;
  read: boolean;
}

export interface ChatThread {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}
