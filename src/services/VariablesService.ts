import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

export interface VariableInterface {
  id?: number;
  name?: string;
  value?: string;
  sectorId?: number;
}

export const getAllVariables = async () => {
  try {
    const response = await axios.get(`${API_URL}/variables`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all variables:', error);
  }
};

export const getVariablesBySector = async (sectorId: number) => {
  try {
    const response = await axios.get(`${API_URL}/variables/sector/${sectorId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching variables for sector ${sectorId}:`, error);
  }
};

export const createVariable = async (variable: VariableInterface) => {
  try {
    const response = await axios.post(`${API_URL}/variables`, variable);
    return response.data;
  } catch (error) {
    console.error('Error creating variable:', error);
  }
};

export const editVariable = async (id: number, variable: VariableInterface) => {
  try {
    const response = await axios.put(`${API_URL}/variables/${id}`, variable);
    return response.data;
  } catch (error) {
    console.error(`Error editing variable with id ${id}:`, error);
  }
};

export const deleteVariable = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/variables/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting variable with id ${id}:`, error);
  }
};
