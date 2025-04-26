import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const UNOFFICIAL_API_URL = process.env.REACT_APP_UNOFFICIAL_API_URL || '/unofficial';

export interface WhatsAppConnection {
  id: number;
  sectorId: number;
  status: string;
  qrcodeBase64: string | null;
  lastQrcodeGeneratedAt: string | null;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  sessionData: any;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppStatus {
  connected: boolean;
  message: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export interface Sector {
  id: number;
  name: string;
  description: string;
  userBusinessId?: number;
  phoneNumberId: string;
  accessToken: string;
  googleClientId?: string;
  googleApiKey?: string;
  oauth2AccessToken?: string;
  oauth2RefreshToken?: string;
  oauth2TokenExpiration?: Date;
  isOfficial: boolean;
  whatsappConnection?: WhatsAppConnection;
}

export interface CreateSectorRequestDTO {
  name: string;
  description: string;
  userBusinessId?: number;
  phoneNumberId: string;
  accessToken: string;
  googleClientId?: string;
  googleApiKey?: string;
  isOfficial: boolean;
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
  isOfficial?: boolean;
}

export interface SectorResponse {
  message: string;
  code: string;
  data: Sector[];
}

export interface SingleSectorResponse {
  message: string;
  code: string;
  data: Sector;
}

export const createSector = async (sectorData: CreateSectorRequestDTO) => {
  try {
    const response = await axios.post(`${API_URL}/sectors`, sectorData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSector = async (id: number, data: UpdateSectorRequestDTO) => {
  try {
    const response = await axios.put(`${API_URL}/sectors/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSector = async (id: number): Promise<Sector> => {
  try {
    const response = await axios.get<SingleSectorResponse>(`${API_URL}/sectors/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getSectors = async (token: string): Promise<Sector[]> => {
  try {
    const response = await axios.get<SectorResponse>(`${API_URL}/sectors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
      },
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSector = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/sectors/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWhatsAppStatus = async (sectorId: number, isOfficial: boolean): Promise<WhatsAppStatus> => {
  try {
    if (isOfficial) {
      const response = await axios.get(`${API_URL}/status`, {
        params: { sector_id: sectorId }
      });
      return response.data;
    } else {
      const response = await axios.get(`${UNOFFICIAL_API_URL}/status`, {
        params: { sector_id: sectorId }
      });
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

interface UnofficialQRCodeResponse {
  status: string;
  message: string;
  data: {
    instructions: string;
    qrcode: string;
  };
  timestamp: string;
}

interface QRCodeResponse {
  qrcode: string;
  instructions?: string;
}

export const getWhatsAppQRCode = async (sectorId: number, isOfficial: boolean): Promise<QRCodeResponse> => {
  try {
    if (isOfficial) {
      const response = await axios.get(`${API_URL}/qrcode`, {
        params: { sector_id: sectorId }
      });
      return {
        qrcode: response.data.qrcode
      };
    } else {
      const response = await axios.get<UnofficialQRCodeResponse>(`${UNOFFICIAL_API_URL}/qrcode`, {
        params: { sector_id: sectorId }
      });
      return {
        qrcode: response.data.data.qrcode,
        instructions: response.data.data.instructions
      };
    }
  } catch (error) {
    throw error;
  }
};

export const getWhatsAppConnection = async (sectorId: number, isOfficial: boolean): Promise<WhatsAppConnection> => {
  try {
    if (isOfficial) {
      const response = await axios.get(`${API_URL}/whatsapp-connections`, {
        params: { sector_id: sectorId }
      });
      return response.data;
    } else {
      const response = await axios.get(`${UNOFFICIAL_API_URL}/whatsapp-connections`, {
        params: { sector_id: sectorId }
      });
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};
