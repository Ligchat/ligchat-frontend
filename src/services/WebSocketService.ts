import { MessageType } from './MessageService';
import ChatWebSocketService from './ChatWebSocketService';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: MessageType) => void)[] = [];
  private contactsListHandlers: ((contacts: any[]) => void)[] = [];
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
  // Flag para indicar que estamos usando o ChatWebSocketService internamente
  private usingSingletonService = true;

  constructor() {
    console.log('⚠️ [WebSocketService] Construindo WebSocketService (usando adaptador para ChatWebSocketService)');
  }

  connect(sectorId: string) {
    // Implementação adaptada para usar o ChatWebSocketService singleton
    console.log('🔄 [WebSocketService-Adapter] Conectando via adaptador usando ChatWebSocketService singleton');
    this.currentSectorId = sectorId;
    
    try {
      // Usar o serviço singleton para a conexão real
      ChatWebSocketService.connect(
        localStorage.getItem('token') || '', 
        this.handleSharedWebSocketMessage.bind(this),
        Number(sectorId)
      );
    } catch (error) {
      console.error('❌ [WebSocketService-Adapter] Erro ao criar conexão:', error);
    }
  }

  // Handler intermediário que recebe mensagens do ChatWebSocketService e repassa para os handlers locais
  private handleSharedWebSocketMessage(message: any) {
    try {
      // Para mensagens do tipo 'message', normalizar e enviar para handlers de mensagem
      if (message.type === 'message') {
        const normalizedMessage = this.normalizeMessage(message);
        this.messageHandlers.forEach((handler, index) => {
          try {
            handler(normalizedMessage);
          } catch (error) {
            console.error(`❌ [WebSocketService-Adapter] Erro no handler ${index + 1}:`, error);
          }
        });
      } 
      // Para mensagens do tipo 'contacts_list', enviar apenas para handlers de contacts_list
      else if (message.type === 'contacts_list' && message.payload?.contacts) {
        this.contactsListHandlers.forEach((handler, index) => {
          try {
            handler(message.payload.contacts);
          } catch (error) {
            console.error(`❌ [WebSocketService-Adapter] Erro no handler de contacts_list ${index + 1}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('❌ [WebSocketService-Adapter] Erro ao processar mensagem:', error);
    }
  }

  // Manter o método de normalização para compatibilidade
  private normalizeMessage(message: any): MessageType {
    console.log('🔄 [WebSocketService-Adapter] Normalizando mensagem');
    
    const messageData = message.data || message.payload || message;
    
    let mediaType = messageData.mediaType || messageData.type || 'text';
    let mediaUrl = null;
    let localUrl = null;
    let fileName = null;
    let mimeType = null;

    if (mediaType === 'image' || mediaType === 'video') {
      mediaUrl = messageData.mediaUrl || messageData.url;
      localUrl = messageData.localUrl;
      mimeType = messageData.mimeType || messageData.mime_type || `${mediaType}/jpeg`;
      fileName = messageData.fileName || messageData.file_name || `${mediaType}.${mimeType.split('/')[1]}`;
    } else if (mediaType === 'document') {
      mediaUrl = messageData.mediaUrl || messageData.url;
      localUrl = messageData.localUrl;
      mimeType = messageData.mimeType || messageData.mime_type;
      fileName = messageData.fileName || messageData.file_name || 'document';
    } else if (mediaType === 'audio' || mediaType === 'voice') {
      mediaUrl = messageData.mediaUrl || messageData.url;
      localUrl = messageData.localUrl;
      mimeType = messageData.mimeType || messageData.mime_type || 'audio/mpeg';
      fileName = messageData.fileName || messageData.file_name || 'audio.mp3';
      mediaType = 'audio';
    }

    const normalized = {
      id: messageData.id || messageData.message_id || Date.now(),
      content: messageData.content || messageData.caption || '',
      isSent: false,
      mediaType,
      mediaUrl,
      localUrl,
      fileName,
      mimeType,
      sectorId: messageData.sectorId || messageData.sector_id || this.currentSectorId,
      contactID: messageData.contactID || messageData.contact_id,
      isRead: false,
      sentAt: messageData.sentAt || (messageData.timestamp ? new Date(messageData.timestamp * 1000).toISOString() : new Date().toISOString()),
      type: message.type,
      attachment: mediaUrl ? {
        url: mediaUrl,
        localUrl,
        type: mediaType,
        name: fileName || ''
      } : undefined
    };

    return normalized;
  }

  // Métodos de suporte mantidos apenas por compatibilidade
  addMessageHandler(handler: (message: MessageType) => void) {
    console.log('➕ [WebSocketService-Adapter] Adicionando handler de mensagem');
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: MessageType) => void) {
    console.log('➖ [WebSocketService-Adapter] Removendo handler de mensagem');
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  addContactsListHandler(handler: (contacts: any[]) => void) {
    console.log('➕ [WebSocketService-Adapter] Adicionando handler de contacts_list');
    this.contactsListHandlers.push(handler);
    
    // Se já estiver usando o serviço global, também registrar lá
    if (this.usingSingletonService && ChatWebSocketService.isConnected) {
      ChatWebSocketService.addContactsListHandler(handler);
    }
  }

  removeContactsListHandler(handler: (contacts: any[]) => void) {
    console.log('➖ [WebSocketService-Adapter] Removendo handler de contacts_list');
    this.contactsListHandlers = this.contactsListHandlers.filter(h => h !== handler);
    
    // Se estiver usando o serviço global, também remover de lá
    if (this.usingSingletonService) {
      ChatWebSocketService.removeContactsListHandler(handler);
    }
  }

  disconnect() {
    console.log('🔌 [WebSocketService-Adapter] Desconectando (sem efeito real - gerenciado pelo singleton)');
    this.messageHandlers = [];
    this.contactsListHandlers = [];
    this.currentSectorId = null;
    
    // Não desconecta o ChatWebSocketService, apenas limpa os handlers locais
    // O ChatWebSocketService será gerenciado pelo CombinedMenu
  }
} 