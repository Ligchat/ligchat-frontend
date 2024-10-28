import axios from "axios";

export interface Sector {
  id: number ;
  name: string;
  description: string;
  userBusinessId: number | undefined;
}

export interface CreateSectorRequestDTO {
  name: string;
  description: string;
  userBusinessId: number | undefined;
}

export interface UpdateSectorRequestDTO {
  name: string;
  description: string;
  userBusinessId: number;
}

export const createSector = async (sectorData: any) => {
  try {
    const response = await axios.post('/api/sectors', sectorData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create sector: ${error}`);
  }
};

export const updateSector = async (id: number, data: any) => {
  try {
    const response = await axios.put(`/api/sectors/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update sector with id ${id}: ${error}`);
  }
};

export const getSector = async (id: number): Promise<Sector> => {
  try {
    const response = await axios.get(`/api/sectors/${id}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get sector with id ${id}: ${error}`);
  }
};

export const getSectors = async (token:any): Promise<Sector[]> => {
  try {
    const response = await axios.get('/api/sectors', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get sectors: ' + error);
  }
};

export const deleteSector = async (id: number) => {
  try {
    const response = await axios.delete(`/api/sectors/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete sector with id ${id}: ${error}`);
  }
};