import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatar_url?: string;
  sector_id?: number;
  tag_id?: number;
  status: boolean;
  email?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  ai_active: boolean;
}

export interface Card {
  id: number;
  contactId: number;
  columnId: number;
  position: number;
  sectorId: number;
  createdAt: string;
  contact: any | null;
}

export interface CreateCardRequestDTO {
  title: string;
  content?: string;
  email?: string;
  phone?: string;
  status?: string;
  assignedTo?: string;
  assigneeAvatar?: string;
  lastContact?: Date;
  priority?: 'high' | 'medium' | 'low';
  contactId: number;
  tagId?: number;
  columnId: number;
  sectorId: number;
  position: number;
}

export interface UpdateCardRequestDTO {
  id: string;
  contactId: number;
  columnId: number;
  position: number;
  sectorId: number;
  createdAt?: string;
}

export const getContacts = async (sectorId: number): Promise<Contact[]> => {
  try {
    const response = await axios.get(`${API_URL}/contatos`, {
      params: { sectorId },
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data.map((contact: any) => ({
      ...contact,
      id: contact.id.toString()
    }));
  } catch (error) {
    throw new Error('Failed to get contacts: ' + error);
  }
};

export const createCard = async (cardData: CreateCardRequestDTO): Promise<Card> => {
  try {
    if (!cardData.contactId) {
      throw new Error('A contact must be selected');
    }
    
    const position = Math.max(1, Math.min(99, cardData.position || 1));
    const response = await axios.post(`${API_URL}/cards`, {
      ...cardData,
      position
    });
    return {
      ...response.data,
      id: response.data.id.toString(),
      contato: response.data.contato ? {
        ...response.data.contato,
        id: response.data.contato.id.toString()
      } : undefined
    };
  } catch (error) {
    throw new Error(`Failed to create card: ${error}`);
  }
};

export const updateCard = async (id: string, data: UpdateCardRequestDTO): Promise<Card> => {
  try {
    const response = await axios.put<Card>(`${API_URL}/Card/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update card with id ${id}: ${error}`);
  }
};

export const getCard = async (id: string): Promise<Card> => {
  try {
    const response = await axios.get(`${API_URL}/cards/${id}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return {
      ...response.data,
      id: response.data.id.toString(),
      contato: response.data.contato ? {
        ...response.data.contato,
        id: response.data.contato.id.toString()
      } : undefined
    };
  } catch (error) {
    throw new Error(`Failed to get card with id ${id}: ${error}`);
  }
};

export const getCards = async (sectorId: number): Promise<Card[]> => {
  try {
    console.log('Buscando cards para o setor:', sectorId);
    
    const token = localStorage.getItem('token');
    const response = await axios.get<Card[]>(
      `${API_URL}/Cards?sectorId=${sectorId}`,
      {
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`
        },
      }
    );
    
    console.log('Resposta da API de cards:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Erro detalhado ao obter cards:', error);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
      console.error('Status:', error.response.status);
    }
    throw new Error('Falha ao obter cards: ' + error);
  }
};

export const deleteCard = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/cards/${id}`);
  } catch (error) {
    throw new Error(`Failed to delete card with id ${id}: ${error}`);
  }
};

export const moveCard = async (id: string, newColumnId: number, newPosition: number): Promise<void> => {
  try {
    await axios.put(`${API_URL}/cards/${id}/move`, { newColumnId, newPosition }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    throw new Error(`Failed to move card with id ${id} to column with id ${newColumnId}: ${error}`);
  }
};
