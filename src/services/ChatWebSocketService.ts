type MessagePayload = {
  id: number;
  contactID: number;
  sectorId: number;
  content: string;
  mediaType: 'text' | 'image' | 'audio' | 'document';
  mediaUrl: string | null;
  fileName?: string;
  mimeType?: string;
  sentAt: string;
  isSent: boolean;
  isRead: boolean;
};

type OnMessageCallback = (msg: MessagePayload) => void;

class ChatWebSocketService {
  private socket: WebSocket | null = null;
  private onMessageCallback: OnMessageCallback | null = null;

  connect(token: string, onMessage: OnMessageCallback, sectorId?: number) {
    this.onMessageCallback = onMessage;
    const sectorParam = sectorId ? `?sector_id=${sectorId}` : '';
    this.socket = new WebSocket(`wss://unofficial.ligchat.com/api/v1/ws${sectorParam}`);

    this.socket.onopen = () => {};
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessageCallback?.(data);
    };
    this.socket.onclose = () => {};
    this.socket.onerror = () => {};
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}

const chatWebSocketService = new ChatWebSocketService();
export default chatWebSocketService; 