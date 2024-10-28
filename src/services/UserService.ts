import axios from "axios";

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

// Interface para a criação de um usuário
export interface UserCreate {
  name: string;
  email: string;
  avatarUrl?: string;
  phoneWhatsapp: string;
  isAdmin?: boolean; // Campo opcional para is_admin
  status?: boolean; // Adiciona status como campo opcional
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
    const response = await axios.post('/api/users', userData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create user: ${error}`);
  }
};

// Serviço para atualizar um usuário
export const updateUser = async (id: number, data: UpdateUserRequestDTO): Promise<User> => {
  try {
    const response = await axios.put(`/api/users/${id}`, data, {
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
    const response = await axios.get(`/api/users/${id}`, {
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
    const response = await axios.get('/api/setores');
    return response.data; // Supondo que a resposta esteja no formato esperado
  } catch (error) {
    throw new Error(`Failed to fetch sectors: ${error}`);
  }
};

// Serviço para buscar todos os usuários
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get('/api/users');
    return response.data; // Supondo que a resposta esteja no formato esperado
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error}`);
  }
};

// Serviço para deletar um usuário
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/api/users/${id}`);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error}`);
  }
};
