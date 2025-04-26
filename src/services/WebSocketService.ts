import { MessageType } from './MessageService';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: MessageType) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentSectorId: string | null = null;
  private isIntentionalClose = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private lastPongTime: number | null = null;
  private isReconnecting = false;
  private lastConnectionAttempt: number = 0;
  private minReconnectDelay = 1000;

  constructor() {}

  connect(sectorId: string) {
    // Prevenir múltiplas tentativas de conexão simultâneas
    const now = Date.now();
    if (this.isReconnecting || (now - this.lastConnectionAttempt < this.minReconnectDelay)) {
      console.log('🚫 [WebSocketService] Tentativa de conexão ignorada - reconexão em andamento ou muito cedo');
      return;
    }

    this.lastConnectionAttempt = now;

    if (this.ws) {
      console.log('🔄 [WebSocketService] Desconectando WebSocket existente antes de nova conexão');
      this.disconnect();
    }

    const url = `wss://unofficial.ligchat.com/api/v1/ws/${sectorId}`;

    console.log('🚀 [WebSocketService] Iniciando conexão:', {
      sectorId,
      url,
      reconnectAttempts: this.reconnectAttempts
    });

    try {
      this.ws = new WebSocket(url);
      this.isIntentionalClose = false;
      this.currentSectorId = sectorId;
      this.setupWebSocketHandlers();
      this.setupConnectionCheck();
    } catch (error) {
      console.error('❌ [WebSocketService] Erro ao criar conexão:', error);
      this.handleReconnect();
    }
  }

  private setupConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    // Envia ping a cada 30 segundos
    this.connectionCheckInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          console.log('💓 [WebSocketService] Enviando ping');
          this.ws.send(JSON.stringify({ type: 'ping' }));
          
          // Se não receber pong em 10 segundos, considera conexão perdida
          setTimeout(() => {
            if (this.lastPongTime && Date.now() - this.lastPongTime > 10000) {
              console.log('⚠️ [WebSocketService] Timeout no ping/pong, reconectando...');
              this.reconnect();
            }
          }, 10000);
        } catch (error) {
          console.error('❌ [WebSocketService] Erro ao enviar ping:', error);
          this.reconnect();
        }
      }
    }, 30000);
  }

  private reconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handleReconnect();
  }

  private normalizeMessage(message: any): MessageType {
    console.log('🔄 [WebSocketService] Normalizando mensagem:', message);
    
    const messageData = message.data || message;
    
    let mediaType = messageData.type || 'text';
    let mediaUrl = null;
    let localUrl = null;
    let fileName = null;
    let mimeType = null;

    if (messageData.type === 'image' || messageData.type === 'video') {
      mediaUrl = messageData.url || messageData.mediaUrl;
      localUrl = messageData.localUrl;
      mimeType = messageData.mime_type || messageData.mimeType || `${messageData.type}/jpeg`;
      fileName = messageData.file_name || messageData.fileName || `${messageData.type}.${mimeType.split('/')[1]}`;
    } else if (messageData.type === 'document') {
      mediaUrl = messageData.url || messageData.mediaUrl;
      localUrl = messageData.localUrl;
      mimeType = messageData.mime_type || messageData.mimeType;
      fileName = messageData.file_name || messageData.fileName || 'document';
    } else if (messageData.type === 'audio' || messageData.type === 'voice') {
      mediaUrl = messageData.url || messageData.mediaUrl;
      localUrl = messageData.localUrl;
      mimeType = messageData.mime_type || messageData.mimeType || 'audio/mpeg';
      fileName = messageData.file_name || messageData.fileName || 'audio.mp3';
      mediaType = 'audio';
    }

    const normalized = {
      id: messageData.message_id || messageData.id || Date.now(),
      content: messageData.content || messageData.caption || '',
      isSent: false,
      mediaType,
      mediaUrl,
      localUrl,
      fileName,
      mimeType,
      sectorId: message.sector_id || messageData.sector_id,
      contactID: messageData.contact_id,
      isRead: false,
      sentAt: messageData.timestamp ? new Date(messageData.timestamp * 1000).toISOString() : new Date().toISOString(),
      type: message.type,
      attachment: mediaUrl ? {
        url: mediaUrl,
        localUrl,
        type: mediaType,
        name: fileName || ''
      } : undefined
    };

    console.log('✨ [WebSocketService] Mensagem normalizada:', normalized);
    return normalized;
  }

  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('🌟 [WebSocketService] Conexão estabelecida com sucesso');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.lastPongTime = Date.now();
    };

    this.ws.onmessage = (event) => {
      try {
        console.log('📥 [WebSocketService] Mensagem recebida (raw):', event.data);
        
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(event.data);
          
          // Tratamento especial para mensagens de ping/pong
          if (parsedMessage.type === 'pong') {
            console.log('💗 [WebSocketService] Pong recebido');
            this.lastPongTime = Date.now();
            return;
          }
          
          if (typeof parsedMessage === 'string' && parsedMessage.startsWith('{')) {
            parsedMessage = JSON.parse(parsedMessage);
          }
          console.log('🔄 [WebSocketService] Mensagem após parse:', parsedMessage);
        } catch (e) {
          console.error('❌ [WebSocketService] Erro ao fazer parse da mensagem:', e);
          return;
        }
        
        const normalizedMessage = this.normalizeMessage(parsedMessage);
        console.log('✨ [WebSocketService] Mensagem normalizada:', normalizedMessage);
        
        console.log('📢 [WebSocketService] Notificando handlers:', {
          handlersCount: this.messageHandlers.length,
          messageId: normalizedMessage.id,
          contactId: normalizedMessage.contactID
        });

        this.messageHandlers.forEach((handler, index) => {
          try {
            console.log(`🎯 [WebSocketService] Executando handler ${index + 1}/${this.messageHandlers.length}`);
            handler(normalizedMessage);
          } catch (error) {
            console.error(`❌ [WebSocketService] Erro no handler ${index + 1}:`, error);
          }
        });
      } catch (error) {
        console.error('❌ [WebSocketService] Erro ao processar mensagem:', error);
      }
    };

    this.ws.onerror = (event) => {
      console.error('❌ [WebSocketService] Erro na conexão:', event);
      // Não iniciar reconexão aqui, deixar o onclose lidar com isso
    };

    this.ws.onclose = (event) => {
      console.log(`🔒 [WebSocketService] Conexão fechada. Código: ${event.code}, Razão: ${event.reason || 'Não especificada'}`);
      
      // Não tentar reconectar se o fechamento foi intencional
      if (this.isIntentionalClose) {
        console.log('✋ [WebSocketService] Fechamento intencional - não tentando reconectar');
        return;
      }

      // Tratar diferentes códigos de fechamento
      switch (event.code) {
        case 1000: // Fechamento normal
          console.log('�� [WebSocketService] Fechamento normal da conexão');
          break;
        case 1006: // Fechamento anormal
          console.log('⚠️ [WebSocketService] Fechamento anormal - iniciando reconexão');
          this.handleReconnect();
          break;
        default:
          if (!this.isReconnecting) {
            console.log('🔄 [WebSocketService] Código de fechamento não esperado - tentando reconectar');
            this.handleReconnect();
          }
      }
    };
  }

  private handleReconnect() {
    if (this.isIntentionalClose || !this.currentSectorId || this.isReconnecting) {
      console.log('🚫 [WebSocketService] Reconexão ignorada:', {
        isIntentionalClose: this.isIntentionalClose,
        hasSectorId: !!this.currentSectorId,
        isReconnecting: this.isReconnecting
      });
      return;
    }

    this.isReconnecting = true;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      console.log(`⏳ [WebSocketService] Agendando reconexão em ${delay}ms (tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`🔄 [WebSocketService] Tentativa de reconexão ${this.reconnectAttempts} de ${this.maxReconnectAttempts}`);
        this.connect(this.currentSectorId!);
      }, delay);
    } else {
      console.error('❌ [WebSocketService] Número máximo de tentativas de reconexão atingido');
      this.isReconnecting = false;
    }
  }

  addMessageHandler(handler: (message: MessageType) => void) {
    console.log('➕ [WebSocketService] Adicionando novo handler. Total:', this.messageHandlers.length + 1);
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: MessageType) => void) {
    const previousCount = this.messageHandlers.length;
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    console.log('➖ [WebSocketService] Removendo handler. Antes:', previousCount, 'Depois:', this.messageHandlers.length);
  }

  disconnect() {
    console.log('🔌 [WebSocketService] Iniciando desconexão');
    this.isIntentionalClose = true;
    this.currentSectorId = null;
    this.isReconnecting = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    if (this.ws) {
      try {
        console.log('👋 [WebSocketService] Fechando conexão WebSocket');
        this.ws.close(1000, 'Desconexão intencional');
      } catch (error) {
        console.error('❌ [WebSocketService] Erro ao fechar conexão:', error);
      } finally {
        this.ws = null;
      }
    }

    this.reconnectAttempts = 0;
    console.log('✅ [WebSocketService] Desconexão completa');
  }
} 