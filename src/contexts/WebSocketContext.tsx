import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { MessageType as BaseMessageType } from '../services/MessageService';
import SessionService from '../services/SessionService';

// Estende o tipo MessageType para incluir contactName
export interface MessageType extends BaseMessageType {
  contactName?: string;
}

interface WebSocketContextType {
  webSocketService: WebSocketService | null;
  isConnected: boolean;
  lastMessage: MessageType | null;
  connect: (sectorId: string) => void;
  disconnect: () => void;
  addMessageHandler: (handler: (message: MessageType) => void) => void;
  removeMessageHandler: (handler: (message: MessageType) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  webSocketService: null,
  isConnected: false,
  lastMessage: null,
  connect: () => {},
  disconnect: () => {},
  addMessageHandler: () => {},
  removeMessageHandler: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webSocketService] = useState<WebSocketService>(() => new WebSocketService());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<MessageType | null>(null);
  const [currentSectorId, setCurrentSectorId] = useState<string | null>(null);

  const connect = useCallback((sectorId: string) => {
    if (sectorId) {
      console.log('WebSocketContext: Connecting to WebSocket with sectorId:', sectorId);
      webSocketService.connect(sectorId);
      setCurrentSectorId(sectorId);
      setIsConnected(true);
    }
  }, [webSocketService]);

  const disconnect = useCallback(() => {
    console.log('WebSocketContext: Disconnecting from WebSocket');
    webSocketService.disconnect();
    setCurrentSectorId(null);
    setIsConnected(false);
  }, [webSocketService]);

  const handleMessage = useCallback((message: MessageType) => {
    console.log('WebSocketContext: Received message:', message);
    setLastMessage(message);
  }, []);

  useEffect(() => {
    // Adiciona o handler de mensagens do contexto
    webSocketService.addMessageHandler(handleMessage);

    // Função de limpeza
    return () => {
      webSocketService.removeMessageHandler(handleMessage);
      webSocketService.disconnect();
    };
  }, [webSocketService, handleMessage]);

  useEffect(() => {
    // Verifica se há um setor selecionado e se conecta automaticamente
    const sectorId = SessionService.getSectorId();
    if (sectorId && !currentSectorId) {
      connect(sectorId.toString());
    }
  }, [connect, currentSectorId]);

  // Reconecta quando o setor muda
  useEffect(() => {
    const handleSectorChange = () => {
      const newSectorId = SessionService.getSectorId();
      
      // Desconecta se não houver setor selecionado
      if (!newSectorId) {
        disconnect();
        return;
      }

      // Reconecta se o setor mudou
      if (newSectorId && newSectorId.toString() !== currentSectorId) {
        disconnect();
        connect(newSectorId.toString());
      }
    };

    // Adiciona listener para mudança de setor
    window.addEventListener('sectorChanged', handleSectorChange);

    return () => {
      window.removeEventListener('sectorChanged', handleSectorChange);
    };
  }, [currentSectorId, connect, disconnect]);

  const addMessageHandler = useCallback((handler: (message: MessageType) => void) => {
    webSocketService.addMessageHandler(handler);
  }, [webSocketService]);

  const removeMessageHandler = useCallback((handler: (message: MessageType) => void) => {
    webSocketService.removeMessageHandler(handler);
  }, [webSocketService]);

  const value = {
    webSocketService,
    isConnected,
    lastMessage,
    connect,
    disconnect,
    addMessageHandler,
    removeMessageHandler,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 