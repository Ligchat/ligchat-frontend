import { MessageType } from './MessageService';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: MessageType) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentSectorId: string | null = null;
  private isIntentionalClose = false;

  constructor(private baseUrl: string = 'wss://whatsapp.ligchat.site') {}

  connect(sectorId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
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
    // Função auxiliar para pegar propriedade independente do case
    const getProp = (obj: any, prop: string) => {
      // Tenta com a propriedade exatamente como está
      if (obj[prop] !== undefined) return obj[prop];
      
      // Tenta com primeira letra maiúscula
      const upperCase = prop.charAt(0).toUpperCase() + prop.slice(1);
      if (obj[upperCase] !== undefined) return obj[upperCase];
      
      // Tenta com primeira letra minúscula
      const lowerCase = prop.charAt(0).toLowerCase() + prop.slice(1);
      if (obj[lowerCase] !== undefined) return obj[lowerCase];
      
      return undefined;
    };

    return {
      id: getProp(message, 'id'),
      content: getProp(message, 'content'),
      isSent: getProp(message, 'isSent') ?? false,
      mediaType: getProp(message, 'mediaType'),
      mediaUrl: getProp(message, 'mediaUrl'),
      fileName: getProp(message, 'fileName'),
      sectorId: getProp(message, 'sectorId'),
      contactID: getProp(message, 'contactID'), // Note que esta propriedade é 'contactID' e não 'contactId'
      isRead: getProp(message, 'isRead') ?? false,
      sentAt: getProp(message, 'sentAt') || new Date().toISOString(),
      attachment: getProp(message, 'mediaUrl') ? {
        url: getProp(message, 'mediaUrl'),
        type: getProp(message, 'mediaType') || 'unknown',
        name: getProp(message, 'fileName') || 'download'
      } : undefined
    };
  }

  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket conectado com sucesso');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        console.log('Mensagem recebida:', event.data);
        
        // Primeiro parse
        let parsedMessage = JSON.parse(event.data);
        
        // Verifica se é uma string JSON (caso de mensagem enviada)
        if (typeof parsedMessage === 'string' && parsedMessage.startsWith('{')) {
          try {
            parsedMessage = JSON.parse(parsedMessage);
          } catch (e) {
            // Se falhar o segundo parse, mantém o resultado do primeiro
            console.log('Mensagem já está no formato correto após primeiro parse');
          }
        }
        
        console.log('Mensagem após parse:', parsedMessage);
        const message = this.normalizeMessage(parsedMessage);
        
        console.log('Mensagem normalizada:', message);
        
        this.messageHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Erro no handler da mensagem:', error);
          }
        });
      } catch (error) {
        console.error('Erro ao processar mensagem do WebSocket:', error);
        console.error('Dados recebidos:', event.data);
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

  private adjustMediaUrl(url: string): string {
    if (!url) return url;
    
    if (url.includes('s3.amazonaws.com')) {
        return url;
    }
    
    return url;
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