import axios from 'axios';

export interface Contact {
  id: number;
  name: string;
  phone: string;
  messageId?: number;
  attachmentId?: number;
  generalInfo?: string;
  sectorId: number;
  responsibleId?: number; // Adicionado responsável
}

export interface CreateContactRequestDTO {
  name: string;
  phone: string;
  messageId?: number;
  attachmentId?: number;
  generalInfo: string;
  sectorId: number;
}

export interface UpdateContactRequestDTO {
  name: string;
  phone: string;
  labels: any;
  lastContact: any;
  messageId?: number;
  attachmentId?: number;
  generalInfo: string;
  sectorId: number;
}

export interface UpdateResponsibleRequestDTO {
  responsibleId: number; // DTO para atualizar o responsável
}

export const createContact = async (contactData: CreateContactRequestDTO) => {
  try {
    const response = await axios.post('/server/api/contatos', contactData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create contact: ${error}`);
  }
};

export const updateContact = async (id: number, data: UpdateContactRequestDTO) => {
  try {
    const response = await axios.put(`/server/api/contatos/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update contact: ${error}`);
  }
};

export const updateResponsible = async (id: number, data: UpdateResponsibleRequestDTO) => {
  try {
    const response = await axios.put(`/job/contact/${id}/responsible`, data, {
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
    const response = await axios.get(`/server/api/contatos/${id}`, {
      headers: {
        Accept: '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get contact with id ${id}: ${error}`);
  }
};

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const response = await axios.get('/server/api/contatos', {
      headers: {
        Accept: '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get contacts: ' + error);
  }
};

export const deleteContact = async (id: number) => {
  try {
    const response = await axios.delete(`/server/api/contatos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete contact with id ${id}: ${error}`);
  }
};
