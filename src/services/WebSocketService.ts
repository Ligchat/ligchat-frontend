import { MessageType } from './MessageService';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: MessageType) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentSectorId: string | null = null;
  private isIntentionalClose = false;

  constructor(private baseUrl: string = 'wss://whatsapp.ligchat.com') {}

  connect(sectorId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    this.isIntentionalClose = false;
    this.currentSectorId = sectorId;

    try {
      const wsUrl = `${this.baseUrl}?sectorId=${sectorId}`;
      console.log('Tentando conectar ao WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
      this.handleReconnect();
    }
  }

  private normalizeMessage(message: any): MessageType {
    console.log('Normalizando mensagem no WebSocketService:', message);
    
    // Função auxiliar para pegar propriedade independente do case
    const getProp = (obj: any, prop: string) => {
      const props = [prop, prop.toLowerCase(), prop.toUpperCase(), 
        prop.charAt(0).toUpperCase() + prop.slice(1),
        prop.charAt(0).toLowerCase() + prop.slice(1)
      ];
      
      for (const p of props) {
        if (obj[p] !== undefined) return obj[p];
      }
      return undefined;
    };

    const normalized = {
      id: getProp(message, 'id') || Date.now(),
      content: getProp(message, 'content') || '',
      isSent: getProp(message, 'isSent') ?? false,
      mediaType: getProp(message, 'mediaType') || 'text',
      mediaUrl: getProp(message, 'mediaUrl') || null,
      fileName: getProp(message, 'fileName') || null,
      mimeType: getProp(message, 'mimeType') || null,
      sectorId: getProp(message, 'sectorId'),
      contactID: getProp(message, 'contactID') || getProp(message, 'contactId'),
      isRead: getProp(message, 'isRead') ?? false,
      sentAt: getProp(message, 'sentAt') || new Date().toISOString(),
      type: getProp(message, 'type') || undefined
    };

    console.log('Mensagem normalizada no WebSocketService:', normalized);
    return normalized;
  }

  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket conectado com sucesso');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        console.log('Mensagem WebSocket recebida (raw):', event.data);
        
        let parsedMessage;
        try {
          // Primeiro parse
          parsedMessage = JSON.parse(event.data);
          
          // Se for string JSON, tenta segundo parse
          if (typeof parsedMessage === 'string' && parsedMessage.startsWith('{')) {
            parsedMessage = JSON.parse(parsedMessage);
          }
        } catch (e) {
          console.error('Erro ao fazer parse da mensagem:', e);
          return;
        }
        
        console.log('Mensagem após parse:', parsedMessage);
        const normalizedMessage = this.normalizeMessage(parsedMessage);
        
        console.log('Notificando handlers com mensagem normalizada:', normalizedMessage);
        this.messageHandlers.forEach(handler => {
          try {
            handler(normalizedMessage);
          } catch (error) {
            console.error('Erro no handler da mensagem:', error);
          }
        });
      } catch (error) {
        console.error('Erro ao processar mensagem do WebSocket:', error);
      }
    };

    this.ws.onerror = (event) => {
      console.error('Erro na conexão WebSocket:', event);
      this.handleReconnect();
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket fechado. Código: ${event.code}, Razão: ${event.reason}`);
      if (!this.isIntentionalClose) {
        this.handleReconnect();
      }
    };
  }

  private handleReconnect() {
    if (this.isIntentionalClose || !this.currentSectorId) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Tentativa de reconexão ${this.reconnectAttempts} de ${this.maxReconnectAttempts}`);
        this.connect(this.currentSectorId!);
      }, delay);
    } else {
      console.error('Número máximo de tentativas de reconexão atingido');
    }
  }

  addMessageHandler(handler: (message: MessageType) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: MessageType) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  disconnect() {
    this.isIntentionalClose = true;
    this.currentSectorId = null;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }
} 