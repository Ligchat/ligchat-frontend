import axios from 'axios';
import SessionService from './SessionService';


export interface Attachment {
  type: string;
  content: string;
}

export interface MessageScheduling {
  id: number;
  name: string;
  messageText: string;
  sendDate: string; // Usando string para datas no formato ISO
  flowId: number;
  sectorId: number;
  tagIds: string;
  imageName?: string;
  fileName?: string;
  imageAttachment?: string;
  fileAttachment?: string;
  imageMimeType?: string;
  fileMimeType?: string;
  status: true;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

// DTO para criar um MessageScheduling
export interface CreateMessageSchedulingDTO {
  name: string;
  messageText: string;
  sendDate: string; // ISO string
  flowId: number;
  sectorId: number;
  tagIds: string;
  status: true;
  imageName?: string;
  fileName?: string;
  imageAttachment?: string;
  fileAttachment?: string;
  imageMimeType?: string;
  fileMimeType?: string;
  attachments?: Attachment[];
}

// DTO para atualizar um MessageScheduling
export interface UpdateMessageSchedulingDTO {
  name?: string;
  messageText?: string;
  sendDate?: string; // ISO string
  flowId?: number;
  sectorId?: number;
  tagIds?: string;
  imageName?: string;
  fileName?: string;
  imageAttachment?: string;
  fileAttachment?: string;
  imageMimeType?: string;
  fileMimeType?: string;
  attachments?: Attachment[];
}

// Função para obter todos os MessageSchedulings
export const getMessageSchedulings = async (): Promise<MessageScheduling[]> => {
  const sectorId = SessionService.getSession('selectedSector');
  try {
    const response = await axios.get(`/server/message-schedulings?sectorId=${sectorId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    // Considerando que a resposta possui a estrutura { message, code, data }
    return response.data.data;
  } catch (error: any) {
    throw new Error(`Failed to get message schedulings: ${error.response?.data?.message || error.message}`);
  }
};

// Função para obter um MessageScheduling pelo ID
export const getMessageScheduling = async (id: number): Promise<MessageScheduling> => {
  try {
    const response = await axios.get(`/server/message-schedulings/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(`Failed to get message scheduling with id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

// Função para criar um novo MessageScheduling
export const createMessageScheduling = async (
  messageData: CreateMessageSchedulingDTO
): Promise<MessageScheduling> => {
  try {
    const response = await axios.post('/server/message-schedulings', messageData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(`Failed to create message scheduling: ${error.response?.data?.message || error.message}`);
  }
};

// Função para atualizar um MessageScheduling existente
export const updateMessageScheduling = async (
  id: number,
  data: UpdateMessageSchedulingDTO
): Promise<MessageScheduling> => {
  try {
    const response = await axios.put(`/server/message-schedulings/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(`Failed to update message scheduling with id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

// Função para deletar um MessageScheduling
export const deleteMessageScheduling = async (id: number): Promise<void> => {
  try {
    await axios.delete(`/server/message-schedulings/${id}`);
  } catch (error: any) {
    throw new Error(`Failed to delete message scheduling with id ${id}: ${error.response?.data?.message || error.message}`);
  }
};
