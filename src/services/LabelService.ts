import axios from 'axios';
import SessionService from './SessionService';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

export interface Tag {
  id: number;
  name: string;
  description: string;
  sectorId: number;
}

export interface CreateTagRequestDTO {
  name: string;
  description: string;
  sectorId: number;
}

export interface UpdateTagRequestDTO {
  name: string;
  description: string;
  sectorId: number;
}

export const createTag = async (tagData: CreateTagRequestDTO) => {
  try {
    const response = await axios.post(`${API_URL}/tags`, tagData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create tag: ${error}`);
  }
};

export const updateTag = async (id: number, data: UpdateTagRequestDTO) => {
  try {
    const response = await axios.put(`${API_URL}/tags/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update tag: ${error}`);
  }
};

export const getTag = async (id: number): Promise<Tag> => {
  try {
    const response = await axios.get(`${API_URL}/tags/${id}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get tag with id ${id}: ${error}`);
  }
};

export const getTags = async (): Promise<Tag[]> => {
  const sectorIdFromSession: number | null = SessionService.getSessionForSector();
  
  // Verifique se sectorId está disponível
  if (!sectorIdFromSession) {
    throw new Error('Sector ID is not available in session');
  }

  try {
    const response = await axios.get(`${API_URL}/tags?sectorId=${sectorIdFromSession}`, { // Passando o sectorId na URL
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get tags: ' + error);
  }
};

export const deleteTag = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/tags/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete tag with id ${id}: ${error}`);
  }
};