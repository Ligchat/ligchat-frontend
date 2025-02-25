import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

// Interface para representar um usuário
export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneWhatsapp: string;
  isAdmin?: boolean; // Campo opcional para is_admin
  status?: boolean; // Campo opcional para status
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
  name?: string;
  email?: string;
  avatarUrl?: string;
  phoneWhatsapp?: string;
  isAdmin?: boolean; // Campo opcional para is_admin
  status?: boolean; // Adiciona status como campo opcional
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
    const response = await axios.put(`${API_URL}/users/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
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
    const response = await axios.get(`${API_URL}/setores`);
    return response.data; // Supondo que a resposta esteja no formato esperado
  } catch (error) {
    throw new Error(`Failed to fetch sectors: ${error}`);
  }
};

export const getAllUsers = async (userId?: number | null): Promise<User[]> => { 
  try {
    const response = await axios.get(`${API_URL}/users`, {
      params: { invitedBy: userId }, 
    });
    return response.data; 
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error}`);
  }
}

// Serviço para deletar um usuário
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/users/${id}`);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error}`);
  }
};
