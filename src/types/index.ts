export interface MessageAttachment {
  id: string;
  type: 'image' | 'document';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

export interface MessageType {
  id: number;
  content: string | null;
  mediaType?: string;
  mediaUrl?: string;
  contactID: number;
  sentAt: string;
  isSent: boolean;
  isRead: boolean;
  fileName?: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
    size?: number;
  };
} 