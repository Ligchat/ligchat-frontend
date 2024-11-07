import axios from '../axiosConfig';
export interface Contact {
  id: number;
  name: string;
  phone: string;
  messageId?: number;
  attachmentId?: number;
  generalInfo?: string;
  sectorId: number;
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
  labels:any;
  lastContact:any;
  messageId?: number;
  attachmentId?: number;
  generalInfo: string;
  sectorId: number;
}

export const createContact = async (contactData: CreateContactRequestDTO) => {
  try {
    const response = await axios.post('/api/contatos', contactData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create contact: ${error}`);
  }
};

export const updateContact = async (id: number, data: UpdateContactRequestDTO) => {
  try {
    const response = await axios.put(`/api/contatos/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update contact: ${error}`);
  }
};

export const getContact = async (id: number): Promise<Contact> => {
  try {
    const response = await axios.get(`/api/contatos/${id}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get contact with id ${id}: ${error}`);
  }
};

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const response = await axios.get('/api/contatos', {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get contacts: ' + error);
  }
};

export const deleteContact = async (id: number) => {
  try {
    const response = await axios.delete(`/api/contatos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete contact with id ${id}: ${error}`);
  }
};
