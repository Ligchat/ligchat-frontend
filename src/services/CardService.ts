import axios from "axios";

export interface Contact {
    id: number;
    name: string;
    phone: string;
    email: string;
  }
  
  export interface Card {
    id: number;
    contactId: number;
    tagId?: number;
    columnId: number;
    lastContact: Date | null;
    sectorId: number;
    contact: Contact; // Inclui as informações do contato associado
  }
  
  export interface CreateCardRequestDTO {
    contactId: number;
    tagId?: number;
    columnId: number;
    lastContact: Date | null;
    sectorId: number;
  }
  
  export interface UpdateCardRequestDTO {
    contactId: number;
    tagId?: number;
    columnId: number;
    lastContact: Date | null;
    sectorId: number;
  }
  
export const createCard = async (cardData: CreateCardRequestDTO) => {
  try {
    const response = await axios.post('/api/cards', cardData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create card: ${error}`);
  }
};

export const updateCard = async (id: number, data: UpdateCardRequestDTO) => {
  try {
    const response = await axios.put(`/api/cards/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update card: ${error}`);
  }
};

export const getCard = async (id: number): Promise<Card> => {
  try {
    const response = await axios.get(`/api/cards/${id}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get card with id ${id}: ${error}`);
  }
};

export const getCards = async (): Promise<Card[]> => {
  try {
    const response = await axios.get('/api/cards', {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get cards: ' + error);
  }
};

export const deleteCard = async (id: number) => {
  try {
    const response = await axios.delete(`/api/cards/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete card with id ${id}: ${error}`);
  }
};

export const moveCard = async (id: number, newColumnId: number) => {
    try {
      const response = await axios.put(`/api/Cards/${id}/move`, null, {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          newColumnId,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to move card with id ${id} to column with id ${newColumnId}: ${error}`);
    }
  };