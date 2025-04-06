import axios from 'axios';
import SessionService from './SessionService';
import { Card } from './CardService';

const API_URL = process.env.REACT_APP_API_URL;

export interface Column {
  id: string;
  name: string;
  sectorId: number;
  position: number;
}

interface CreateColumnRequestDTO {
  name: string;
  sectorId: number;
  position: number;
}

interface UpdateColumnRequestDTO {
  name?: string;
  position?: number;
}

export const createColumn = async (columnData: CreateColumnRequestDTO): Promise<Column> => {
  try {
    const response = await axios.post<Column>(`${API_URL}/colunas`, columnData);
    return {
      ...response.data,
      id: response.data.id.toString()
    };
  } catch (error) {
    throw new Error(`Falha ao criar coluna: ${error}`);
  }
};

export const updateColumn = async (id: string, data: UpdateColumnRequestDTO): Promise<Column> => {
  try {
    const response = await axios.put<Column>(`${API_URL}/colunas/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return {
      ...response.data,
      id: response.data.id.toString()
    };
  } catch (error) {
    throw new Error(`Falha ao atualizar coluna com id ${id}: ${error}`);
  }
};

export const getColumn = async (id: string): Promise<Column> => {
  try {
    const response = await axios.get<Column>(`${API_URL}/colunas/${parseInt(id)}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return {
      ...response.data,
      id: response.data.id.toString()
    };
  } catch (error) {
    throw new Error(`Falha ao obter coluna com id ${id}: ${error}`);
  }
};

export const getColumns = async (): Promise<Column[]> => {
  try {
    const sectorId = SessionService.getSectorId();
    console.log('Buscando colunas para o setor:', sectorId);
    
    if (!sectorId) {
      throw new Error('Setor não selecionado');
    }
    
    const response = await axios.get<Column[]>(`${API_URL}/colunas`, {
      params: { sectorId: sectorId },
      headers: {
        'Accept': '*/*',
      },
    });
    
    console.log('Resposta da API de colunas:', response.data);
    
    return response.data.map(column => ({
      ...column,
      id: column.id.toString()
    }));
  } catch (error: any) {
    console.error('Erro detalhado ao obter colunas:', error);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
      console.error('Status:', error.response.status);
    }
    throw new Error('Falha ao obter colunas: ' + error);
  }
};

export const deleteColumn = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/colunas/${id}`);
  } catch (error) {
    throw new Error(`Falha ao excluir coluna com id ${id}: ${error}`);
  }
};

export const moveColumn = async (id: string, newPosition: number): Promise<void> => {
  try {
    await axios.put(`${API_URL}/colunas/${id}/move`, { newPosition }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    throw new Error(`Falha ao mover a coluna com id ${id} para a posição ${newPosition}: ${error}`);
  }
};
  
