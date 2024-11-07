import { message } from 'antd';
import SessionService from './SessionService';
import axios from '../axiosConfig';

// Interface para a entidade Flow
export interface Flow {
    data: Flow[];
  isEditing: any;
  id: string;
  folderId:number;
  name: string;
  version: string;
  exec: number;
  ctr: number;
  shared: boolean;
  isActive: boolean;
}

// DTO para criação de um novo fluxo
export interface CreateFlowRequestDTO {
  name: string;
  sectorId: number;
  folderId: number;
  shared: boolean;
  isActive: boolean;
  // Adicione outros campos conforme necessário
}

// DTO para atualização de um fluxo existente
export interface UpdateFlowRequestDTO {
  name?: string;
  sectorId?: number;
  folderId?: number;
  shared?: boolean;
  isActive?: boolean;
  // Adicione outros campos conforme necessário
}

// Função para obter uma lista de fluxos com base em sectorId e folderId
export const getFlows = async (
  sectorId: any,
  folderId: number,
  token: string
): Promise<Flow[]> => {
  try {
    const response = await axios.get('/api/flows', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: '*/*',
      },
      params: {
        sectorId: sectorId,
        folderId: folderId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao obter fluxos:', error);
    throw new Error('Falha ao obter fluxos: ' + (error.response?.data?.message || error.message));
  }
};

// Função para criar um novo fluxo
export const createFlow = async (
  flowData: any,
): Promise<Flow> => {
  try {
    const sectorId = SessionService.getSession('selectedSector')
    flowData.sectorId = sectorId;
    const response = await axios.post('/api/flows', flowData);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar fluxo:', error);
    throw new Error(`Falha ao criar fluxo: ${error.response?.data?.message || error.message}`);
  }
};

// Função para obter um fluxo específico por ID
export const getFlow = async (id: string, token: string): Promise<Flow> => {
  try {
    const response = await axios.get(`/api/flows/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: '*/*',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao obter fluxo com id ${id}:`, error);
    throw new Error(`Falha ao obter fluxo com id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

// Função para atualizar um fluxo existente
export const updateFlow = async (
  id: string,
  data: UpdateFlowRequestDTO,
  token: string
): Promise<Flow> => {
  try {
    const response = await axios.put(`/api/flows/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao atualizar fluxo com id ${id}:`, error);
    throw new Error(`Falha ao atualizar fluxo com id ${id}: ${error.response?.data?.message || error.message}`);
  }
};

// Função para deletar um fluxo por ID
export const deleteFlow = async (id: string, token: string): Promise<void> => {
  try {
    await axios.delete(`/api/flows/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    console.error(`Erro ao deletar fluxo com id ${id}:`, error);
    throw new Error(`Falha ao deletar fluxo com id ${id}: ${error.response?.data?.message || error.message}`);
  }
};
