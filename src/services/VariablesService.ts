import axios from "axios";

export interface VariableInterface {
  id?: number;
  name?: string;
  value?: string;
  sectorId?: number;
}

export const getAllVariables = async () => {
  try {
    const response = await axios.get('/api/variables');
    return response.data;
  } catch (error) {
    console.error('Error fetching all variables:', error);
  }
};

export const getVariablesBySector = async (sectorId: number) => {
  try {
    const response = await axios.get(`/api/variables/sector/${sectorId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching variables for sector ${sectorId}:`, error);
  }
};

export const createVariable = async (variable: VariableInterface) => {
  try {
    const response = await axios.post('/api/variables', variable);
    return response.data;
  } catch (error) {
    console.error('Error creating variable:', error);
  }
};

export const editVariable = async (id: number, variable: VariableInterface) => {
  try {
    const response = await axios.put(`/api/variables/${id}`, variable);
    return response.data;
  } catch (error) {
    console.error(`Error editing variable with id ${id}:`, error);
  }
};

export const deleteVariable = async (id: number) => {
  try {
    const response = await axios.delete(`/api/variables/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting variable with id ${id}:`, error);
  }
};
