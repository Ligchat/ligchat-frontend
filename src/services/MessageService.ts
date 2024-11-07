import axios from 'axios';

// Interfaces para as requisições
export interface SendMessageDto {
  content: string;
  mediaType?: string; // Opcional se não for sempre necessário
  mediaUrl?: string; // Opcional
  sectorId: number;
  recipient: string;
  contactId: number;
}

export interface SendFileDto {
  base64File: string;
  mediaType: string;
  fileName: string;
  caption: string;
  recipient: string;
  contactId: number;
  sectorId: number;
}

// Interface de resposta para mensagens
export interface MessageResponse {
  id: number;
}

export interface MessageType {
  id: number; // Identificador único da mensagem
  content: string | null; // Conteúdo da mensagem
  isSent: boolean; // Indica se a mensagem foi enviada
  mediaType?: string; // Tipo de mídia (opcional)
  mediaUrl?: string; // URL da mídia (opcional)
  sectorId: number; // ID do setor associado (se necessário)
  contactId: number; // ID do contato associado (se necessário)
}


// Função para enviar mensagem
export const sendMessage = async (message: SendMessageDto): Promise<MessageResponse> => {
  try {
    const response = await axios.post('/whatsapp/send-message', message, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data; // Retorna a resposta com os dados da mensagem
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error; // Lança o erro para que possa ser tratado em outro lugar
  }
};

// Função para enviar arquivo
export const sendFile = async (file: SendFileDto): Promise<MessageResponse> => {
  try {
    const response = await axios.post('/whatsapp/send-file', file, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data; // Retorna a resposta com os dados da mensagem
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    throw error; // Lança o erro para que possa ser tratado em outro lugar
  }
};
