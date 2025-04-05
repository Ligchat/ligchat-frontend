export interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  profilePicture: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface Message {
  id: number;
  content: string;
  isSent: boolean;
  timestamp: string;
  isRead: boolean;
  mediaType?: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
  isHuman: boolean;
  status?: 'sending' | 'sent' | 'error';
} 