import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

// Interface para representar um usuário
export interface User {
  id: number;
  name: string;
  email: string;
  phoneWhatsapp: string;
  avatarUrl: string;
  isAdmin: boolean;
  status: boolean;
  avatar_url?: string;
  sector_id?: number;
  created_at: string;
  updated_at: string;
  sectors?: Array<{
    id: number;
    name: string;
  }>;
}

interface UserCreate {
  name: string;
  email: string;
  phoneWhatsapp: string;
  isAdmin: boolean;
  status: boolean;
  sectors: SectorDTO[]; // Modify this line to accept an array of SectorDTO
  invitedBy: number;
}

interface SectorDTO {
  Id: number;
  IsShared: boolean;
}

// Interface para a atualização de um usuário
export interface UpdateUserRequestDTO {
  name: string;
  email: string;
  avatarUrl: string;
  phoneWhatsapp: string;
  isAdmin: boolean;
  status: boolean;
  sectors: SectorDTO[];
  invitedBy: number;
}

// Interface para representar um setor
export interface Sector {
  id: number;
  name: string;
  description?: string; // Descrição opcional do setor
}

// Serviço para criar um usuário
export const createUser = async (userData: UserCreate): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create user: ${error}`);
  }
};

// Serviço para atualizar um usuário
export const updateUser = async (id: number, data: UpdateUserRequestDTO): Promise<User> => {
  try {
    console.log('Enviando requisição de atualização para o usuário:', id);
    console.log('Dados da atualização:', data);
    
    const response = await axios.put(`${API_URL}/users/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Resposta da API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw new Error(`Failed to update user: ${error}`);
  }
};

// Serviço para obter um usuário pelo ID
export const getUser = async (id: number): Promise<User> => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get user with id ${id}: ${error}`);
  }
};

// Serviço para buscar todos os setores
export const getSectors = async (): Promise<Sector[]> => {
  try {
    const response = await axios.get(`${API_URL}/sectors`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch sectors: ${error}`);
  }
};

export const getAllUsers = async (invitedBy?: number): Promise<User[]> => {
  try {
    console.log('Fazendo requisição para buscar usuários...');
    const params: any = {};
    if (typeof invitedBy === 'number') {
      params.invitedBy = invitedBy;
    }
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        'Accept': '*/*',
      },
      params,
    });
    
    console.log('Resposta da API (users):', response.data);

    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Formato de resposta inesperado:', response.data);
    return [];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
};

// Serviço para deletar um usuário
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/users/${id}`);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error}`);
  }
};
