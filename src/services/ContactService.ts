import axios from 'axios';
import { API_URL, CONTACTS_API_URL } from '../config/api';

// Interface para a resposta da API
interface ApiResponse<T> {
  message: string;
  code: string;
  data: T[];
}

// Interface para o contato
export interface Contact {
  id: number;
  name: string;
  tagId: number | null;
  number: string;
  avatarUrl: string | null;
  email: string;
  notes: string | null;
  sectorId: number;
  isActive: boolean;
  priority: string;
  contactStatus: string;
  aiActive: number;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
  isOfficial: boolean;
}

export interface CreateContactRequestDTO {
  name: string;
  phoneNumber: string;
  email: string;
  sectorId: number;
  status?: string;
  notes?: string;
}

export interface UpdateContactRequestDTO {
  name: string;
  tagId: number | null;
  phoneWhatsapp: string;
  avatarUrl: string | null;
  email: string;
  notes: string | null;
  sectorId: number;
  isActive: boolean;
  priority: string;
  aiActive: number;
  assignedTo: number | null;
}

export interface UpdateResponsibleRequestDTO {
  responsibleId: number;
}

export const getContacts = async (sectorId: number): Promise<ApiResponse<Contact>> => {
  try {
    console.log('Iniciando getContacts:', { sectorId });
    const token = localStorage.getItem('token');
    console.log('Token recuperado:', !!token);
    const url = `${API_URL}/Contact/sector/${sectorId}`;
    const response = await axios.get<ApiResponse<Contact>>(
      url,
      {
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`
        },
      }
    );

    console.log('Resposta recebida:', {
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error) {
    console.error('Erro detalhado em getContacts:', {
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    });
    throw new Error('Falha ao obter contatos: ' + error);
  }
};

export const getContactById = async (id: number): Promise<Contact | null> => {
  try {
    const response = await axios.get(`${CONTACTS_API_URL}/contact/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contact:', error);
    return null;
  }
};

export const createContact = async (contact: CreateContactRequestDTO): Promise<Contact | null> => {
  try {
    const response = await axios.post(`${CONTACTS_API_URL}/contact`, contact);
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error);
    return null;
  }
};

export const updateContact = async (id: number, contact: UpdateContactRequestDTO): Promise<Contact> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put<Contact>(
      `${API_URL}/Contact/${id}`, 
      contact,
      {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw new Error(`Failed to update contact with id ${id}: ${error}`);
  }
};

export const updateResponsible = async (id: number, data: UpdateResponsibleRequestDTO) => {
  try {
    const response = await axios.put(`${CONTACTS_API_URL}/contact/${id}/responsible`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update responsible for contact with id ${id}: ${error}`);
  }
};

export const getContact = async (id: number): Promise<Contact> => {
  try {
    const response = await axios.get(`${CONTACTS_API_URL}/contact/${id}`, {
      headers: {
        Accept: 'text/plain',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get contact with id ${id}: ${error}`);
  }
};

export const deleteContact = async (id: number) => {
  try {
    const response = await axios.delete(`${CONTACTS_API_URL}/contact/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete contact with id ${id}: ${error}`);
  }
};

export const deleteContactFromSector = async (contactId: number, sectorId: number) => {
  try {
    const token = localStorage.getItem('token');
    const url = `${CONTACTS_API_URL}/contact/${contactId}/sector/${sectorId}`;
    const response = await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete contact ${contactId} from sector ${sectorId}: ${error}`);
  }
};

export const markContactAsViewed = async (sectorId: number, contactId: number) => {
  try {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/Contact/mark-as-viewed?sectorId=${sectorId}&contactId=${contactId}`;
    await axios.post(url, '', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      }
    });
    return true;
  } catch (error) {
    console.error('Erro ao marcar contato como visualizado:', error);
    return false;
  }
};
