import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export interface Agent {
  id?: number;
  name: string;
  type: 'gpt' | 'anthropic' | 'grok';
  apiKey: string;
  model: string;
  status: boolean;
  prompt: string;
  sectorId: number;
}

export const getAgents = async (sectorId: number): Promise<Agent[]> => {
  try {
    const response = await axios.get(`${API_URL}/Agent/sector/${sectorId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agentes:', error);
    throw error;
  }
};

export const createAgent = async (agent: Omit<Agent, 'id'>): Promise<Agent> => {
  try {
    const response = await axios.post(`${API_URL}/Agent`, agent);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar agente:', error);
    throw error;
  }
};

export const updateAgent = async (id: number, agent: Partial<Agent>): Promise<Agent> => {
  try {
    const response = await axios.put(`${API_URL}/Agent/${id}`, agent);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar agente:', error);
    throw error;
  }
};

export const deleteAgent = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/Agent/${id}`);
  } catch (error) {
    console.error('Erro ao deletar agente:', error);
    throw error;
  }
}; 