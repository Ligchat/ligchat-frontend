type WebSocketMessage = {
  type: string;
  payload?: {
    contacts?: any[];
    unreadStatus?: Record<string, boolean>;
    [key: string]: any;
  };
  data?: any;
  [key: string]: any;
};

type OnMessageCallback = (msg: any) => void;

// Criar uma chave global para o singleton
const GLOBAL_WS_KEY = '__GLOBAL_CHAT_WEBSOCKET_INSTANCE__';

class ChatWebSocketService {
  private socket: WebSocket | null = null;
  private onMessageCallback: OnMessageCallback | null = null;
  private contactsListHandlers: ((contacts: any[]) => void)[] = [];
  private messageHandlers: ((msg: any) => void)[] = [];
  private currentSectorId: number | null = null;
  private connectingPromise: Promise<void> | null = null;
  
  // Propriedade para verificar se está conectado
  private _isConnected: boolean = false;
  
  constructor() {
    // Verificar se já existe uma instância global
    if ((window as any)[GLOBAL_WS_KEY]) {
      console.log('🚨 [ChatWebSocketService] Usando instância WebSocket existente');
      return (window as any)[GLOBAL_WS_KEY];
    }
    
    // Registrar esta instância globalmente
    console.log('🌟 [ChatWebSocketService] Criando nova instância WebSocket global');
    (window as any)[GLOBAL_WS_KEY] = this;
  }
  
  // Método para verificar se está conectado
  public get isConnected(): boolean {
    return this._isConnected && this.socket?.readyState === WebSocket.OPEN;
  }
  
  // Método para verificar se está conectado ao setor correto
  public isConnectedToSector(sectorId: number): boolean {
    return this.isConnected && this.currentSectorId === sectorId;
  }

  async connect(token: string, onMessage: OnMessageCallback, sectorId?: number): Promise<void> {
    // Se já estiver conectado ao mesmo setor, apenas adicione o callback
    if (this.isConnectedToSector(sectorId || 0)) {
      console.log('🔄 [ChatWebSocketService] Já conectado ao setor, apenas adicionando callback', {
        sectorId,
        currentSectorId: this.currentSectorId
      });
      this.onMessageCallback = onMessage;
      return;
    }
    
    // Se já estiver em processo de conexão, aguarde
    if (this.connectingPromise) {
      console.log('⏳ [ChatWebSocketService] Conexão já em andamento, aguardando...');
      await this.connectingPromise;
      // Após conectado, apenas atualize o callback se for o mesmo setor
      if (this.currentSectorId === sectorId) {
        this.onMessageCallback = onMessage;
        return;
      }
    }
    
    // Desconectar conexão existente se houver
    if (this.socket) {
      console.log('🔌 [ChatWebSocketService] Desconectando WebSocket existente antes de nova conexão');
      this.disconnect();
    }
    
    console.log('🚀 [ChatWebSocketService] Iniciando conexão:', {
      hasSectorId: !!sectorId,
      hasToken: !!token,
      handlersCount: this.contactsListHandlers.length
    });
    
    // Criar promessa de conexão
    this.connectingPromise = new Promise((resolve) => {
      this.onMessageCallback = onMessage;
      this.currentSectorId = sectorId || null;
      const sectorParam = sectorId ? `?sector_id=${sectorId}` : '';
      this.socket = new WebSocket(`wss://unofficial.ligchat.com/api/v1/ws${sectorParam}`);

      this.socket.onopen = () => {
        console.log('🌟 [ChatWebSocketService] Conexão estabelecida com sucesso');
        this._isConnected = true;
        resolve();
      };
      
      this.socket.onmessage = (event) => {
        console.log('📥 [ChatWebSocketService] Mensagem recebida (raw)', 
          event.data.substring(0, 150) + (event.data.length > 150 ? '...' : ''));
        
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          
          // Special handling for contacts_list message type
          if (data.type === 'contacts_list') {
            console.log('📋 [ChatWebSocketService] Lista de contatos recebida:', {
              contactsCount: data.payload?.contacts?.length || 0,
              handlersCount: this.contactsListHandlers.length
            });
            
            // Process contacts list in both services
            if (data.payload?.contacts && Array.isArray(data.payload.contacts)) {
              // Call handlers registered specifically for this service
              this.contactsListHandlers.forEach((handler, index) => {
                try {
                  console.log(`🔄 [ChatWebSocketService] Chamando handler de contacts_list #${index+1}/${this.contactsListHandlers.length}`);
                  handler(data.payload!.contacts!);
                  console.log(`✅ [ChatWebSocketService] Handler #${index+1} executado com sucesso`);
                } catch (error) {
                  console.error(`❌ [ChatWebSocketService] Erro no handler #${index+1}:`, error);
                }
              });
            }
          }
          
          // Chamar todos os handlers de mensagem registrados
          if (data.type === 'message') {
            this.messageHandlers.forEach((handler, idx) => {
              try {
                handler(data);
              } catch (e) {
                console.error(`[ChatWebSocketService] Erro no messageHandler #${idx+1}:`, e);
              }
            });
          }
          
          // Always call the general message handler
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (e) {
          console.error('❌ [ChatWebSocketService] Erro ao processar mensagem:', e);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`🔒 [ChatWebSocketService] Conexão fechada. Código: ${event.code}, Razão: ${event.reason || 'Não especificada'}`);
        this._isConnected = false;
        this.connectingPromise = null;
      };
      
      this.socket.onerror = (event) => {
        console.error('❌ [ChatWebSocketService] Erro na conexão:', event);
        this._isConnected = false;
        this.connectingPromise = null;
        resolve(); // Resolver mesmo com erro, para não bloquear
      };
    });
    
    return this.connectingPromise;
  }

  addContactsListHandler(handler: (contacts: any[]) => void) {
    console.log('➕ [ChatWebSocketService] Adicionando handler de contacts_list', {
      totalBefore: this.contactsListHandlers.length,
      handlerRef: handler.toString().substring(0, 50) + '...'
    });
    this.contactsListHandlers.push(handler);
    console.log('✅ [ChatWebSocketService] Handler adicionado com sucesso. Total:', this.contactsListHandlers.length);
  }

  removeContactsListHandler(handler: (contacts: any[]) => void) {
    console.log('🗑️ [ChatWebSocketService] Removendo handler de contacts_list', {
      totalBefore: this.contactsListHandlers.length
    });
    this.contactsListHandlers = this.contactsListHandlers.filter(h => h !== handler);
    console.log('✅ [ChatWebSocketService] Handler removido com sucesso. Total:', this.contactsListHandlers.length);
  }

  addMessageHandler(handler: (msg: any) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (msg: any) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  disconnect() {
    console.log('🔌 [ChatWebSocketService] Desconectando');
    this.contactsListHandlers = [];
    this._isConnected = false;
    this.currentSectorId = null;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectingPromise = null;
  }
}

// Criar a instância singleton
const chatWebSocketService = new ChatWebSocketService();
export default chatWebSocketService; 