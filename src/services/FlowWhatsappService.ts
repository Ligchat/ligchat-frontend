import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

// Função para obter todos os fluxos
export const getAllFlows = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/FlowWhatsapp`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar todos os fluxos:', error);
    return []; // Retorna um array vazio em caso de erro
  }
};

// Função para obter um fluxo por ID
export const getFlowById = async (id: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/FlowWhatsapp/${id}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar fluxo com ID ${id}:`, error);
    return null; // Retorna null em caso de erro
  }
};

// Função para criar um fluxo
export const createFlow = async (flowData: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/FlowWhatsapp`, flowData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar fluxo:', error);
    return null; // Retorna null em caso de erro
  }
};

// Função para atualizar um fluxo
export const updateFlow = async (id: string, flowData: any): Promise<any> => {
  try {
    const response = await axios.put(`${API_URL}/FlowWhatsapp/${id}`, flowData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar fluxo com ID ${id}:`, error);
    return null; // Retorna null em caso de erro
  }
};

// Função para deletar um fluxo
export const deleteFlow = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/FlowWhatsapp/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar fluxo com ID ${id}:`, error);
  }
};
