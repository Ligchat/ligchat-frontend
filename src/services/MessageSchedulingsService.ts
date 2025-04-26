import axios from 'axios';
import SessionService from './SessionService';

const API_URL = process.env.REACT_APP_API_URL;

export interface Attachment {
  type: 'image' | 'audio' | 'file';
  data: string;
  name: string;
}

export interface MessageSchedulingData {
  contact_id: number;
  message: string;
  scheduled_at: string;
  attachments?: Attachment[];
}

export interface MessageScheduling {
  id: number;
  name: string;
  messageText: string;
  sendDate: string;
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
  contactId?: number;
  contact_id?: number;
}

// DTO para criar um MessageScheduling
export interface CreateMessageSchedulingDTO {
  name: string;
  messageText: string;
  sendDate: string;
  contactId: number;
  sectorId: number;
  status?: boolean;
  tagIds: string;
  attachments?: Attachment[];
}

// DTO para atualizar um MessageScheduling
export interface UpdateMessageSchedulingDTO {
  name?: string;
  messageText?: string;
  sendDate?: string;
  contactId?: number;
  sectorId?: number;
  status?: boolean;
  tagIds: string;
}

// Função para obter todos os MessageSchedulings
export const getMessageSchedulings = async (): Promise<MessageScheduling[]> => {
  const sectorId = SessionService.getSectorId();
  if (!sectorId) {
    throw new Error('No sector selected');
  }
  
  try {
    const response = await axios.get(`${API_URL}/message-schedulings`, {
      params: {
        sectorId: sectorId
      },
      headers: {
        'Accept': 'application/json',
      },
    });

    // Se a resposta for 404 com a mensagem específica, retornar array vazio
    if (response.data.code === '404' && response.data.message === 'No message schedulings found.') {
      return [];
    }

    return response.data.data || [];
  } catch (error: any) {
    // Se for erro 404, retornar array vazio
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// Função para obter um MessageScheduling pelo ID
export const getMessageScheduling = async (id: number): Promise<MessageScheduling> => {
  try {
    const response = await axios.get(`${API_URL}/message-schedulings/${id}`, {
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
    const response = await axios.post(`${API_URL}/message-schedulings`, messageData, {
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
    const response = await axios.put(`${API_URL}/message-schedulings/${id}`, data, {
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
    await axios.delete(`${API_URL}/message-schedulings/${id}`);
  } catch (error: any) {
    throw new Error(`Failed to delete message scheduling with id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

export class MessageSchedulingsService {
  static async create(data: MessageSchedulingData) {
    const sectorId = SessionService.getSectorId();
    if (!sectorId) throw new Error('Setor não selecionado');

    return axios.post(`${API_URL}/message-schedulings`, {
      ...data,
      sector_id: sectorId
    });
  }

  static async list() {
    const sectorId = SessionService.getSectorId();
    if (!sectorId) throw new Error('Setor não selecionado');

    return axios.get(`${API_URL}/message-schedulings?sector_id=${sectorId}`);
  }

  static async delete(id: number) {
    return axios.delete(`${API_URL}/message-schedulings/${id}`);
  }
}
