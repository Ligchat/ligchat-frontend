import axios from 'axios';

// Função para obter todos os fluxos
export const getAllFlows = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`/api/FlowWhatsapp`, {
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
    const response = await axios.get(`/api/FlowWhatsapp/${id}`, {
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
    const response = await axios.post(`/api/FlowWhatsapp`, flowData, {
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
    const response = await axios.put(`/api/FlowWhatsapp/${id}`, flowData, {
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
    await axios.delete(`/api/FlowWhatsapp/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar fluxo com ID ${id}:`, error);
  }
};
