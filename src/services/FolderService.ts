import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

// Interface para a entidade Folder
export interface Folder {
  isEditing?: boolean; // Tornar opcional, pois não é parte da entidade de dados
  id: number;
  name: string;
  sectorId: number;
  userId: number; // Adicionar userId como parte da entidade
}

// DTO para criação de uma nova pasta
export interface CreateFolderRequestDTO {
  name: string;
  sectorId: number;
}

// DTO para atualização de uma pasta existente
export interface UpdateFolderRequestDTO {
  name: string;
  sectorId: any;
}

// Função para criar uma nova pasta
export const createFolder = async (folderData: CreateFolderRequestDTO, token: string): Promise<Folder> => {
  try {
    const response = await axios.post(`${API_URL}/folders`, folderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to create folder: ${error.response?.data?.message || error.message}`);
  }
};

// Função para atualizar uma pasta existente
export const updateFolder = async (id: number, data: UpdateFolderRequestDTO, token: string): Promise<Folder> => {
  try {
    const response = await axios.put(`${API_URL}/folders/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to update folder with id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

// Função para obter uma pasta específica por ID
export const getFolder = async (id: number, token: string, userId: number): Promise<Folder> => {
  try {
    const response = await axios.get(`${API_URL}/folders/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'userId': userId.toString(), // Adiciona o userId no header
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to get folder with id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

// Função para obter todas as pastas
export const getFolders = async (token: string, sectorId: number): Promise<Folder[]> => {
  try {
    const response = await axios.get(`${API_URL}/folders?sectorId=${sectorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error('Failed to get folders: ' + (error.response?.data?.message || error.message));
  }
};

// Função para deletar uma pasta por ID
export const deleteFolder = async (id: number, token: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/folders/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to delete folder with id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

// Interface para Setores (Assumindo que você já tenha isso implementado)
export interface Sector {
  id: number;
  name: string;
}
