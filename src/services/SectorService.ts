import axios from 'axios';

export interface Sector {
  id: number;
  name: string;
  description: string;
  userBusinessId?: number;
  phoneNumberId: string;
  accessToken: string;
  googleClientId?: string;
  googleApiKey?: string;
}

export interface CreateSectorRequestDTO {
  name: string;
  description: string;
  userBusinessId?: number;
  phoneNumberId: string;
  accessToken: string;
  googleClientId?: string;
  googleApiKey?: string;
}

export interface UpdateSectorRequestDTO {
  name?: string;
  description?: string;
  userBusinessId?: number;
  phoneNumberId?: string;
  accessToken?: string;
  googleClientId?: string;
  googleApiKey?: string;
  oauth2AccessToken?: string;
  oauth2RefreshToken?: string;
  oauth2TokenExpiration?: Date;
}


export const createSector = async (sectorData: CreateSectorRequestDTO) => {
  try {
    const response = await axios.post('/server/api/sectors', sectorData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create sector: ${error}`);
  }
};

export const updateSector = async (id: number, data: UpdateSectorRequestDTO) => {
  try {
    const response = await axios.put(`/server/api/sectors/${id}`, data, {
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
    const response = await axios.get(`/server/api/sectors/${id}`, {
      headers: {
        'Accept': '*/*',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get sector with id ${id}: ${error}`);
  }
};

export const getSectors = async (token: any): Promise<Sector[]> => {
  try {
    const response = await axios.get('/server/api/sectors', {
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
    const response = await axios.delete(`/server/api/sectors/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete sector with id ${id}: ${error}`);
  }
};
