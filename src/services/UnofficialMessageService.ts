import axios from 'axios';

const UNOFFICIAL_API_URL = process.env.REACT_APP_UNOFFICIAL_API_URL || 'http://localhost:8080/api/v1';

export interface UnofficialMessageResponse {
  status: string;
  message: string;
  data: {
    recipient: string;
    message?: string;
    fileName?: string;
    mediaType?: string;
  };
  timestamp: string;
}

export interface SendTextMessageDTO {
  sector_id: number;
  recipient: string;
  message: string;
  userId?: number;
  isAnonymous?: boolean;
}

export interface SendImageDTO {
  base64File: string;
  fileName: string;
  mediaType: string;
  recipient: string;
  sectorId: number;
  caption?: string;
  userId?: number;
  isAnonymous?: boolean;
}

export interface SendDocumentDTO {
  base64File: string;
  fileName: string;
  mediaType: string;
  recipient: string;
  sectorId: number;
  caption?: string;
  userId?: number;
  isAnonymous?: boolean;
}

export interface SendMediaMessageDTO {
  base64File: string;
  fileName: string;
  mediaType: string;
  recipient: string;
  sectorId: number;
  caption?: string;
  userId?: number;
  isAnonymous?: boolean;
}

export const sendTextMessage = async (data: SendTextMessageDTO): Promise<UnofficialMessageResponse> => {
  try {
    const response = await axios.post<UnofficialMessageResponse>(`${UNOFFICIAL_API_URL}/send-message`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending unofficial text message:', error);
    throw error;
  }
};

export const sendImage = async (data: SendImageDTO): Promise<UnofficialMessageResponse> => {
  try {
    const payload = {
      base64File: data.base64File,
      fileName: data.fileName,
      mediaType: data.mediaType,
      recipient: data.recipient,
      sectorId: data.sectorId,
      caption: data.caption || ''
    };

    const response = await axios.post<UnofficialMessageResponse>(`${UNOFFICIAL_API_URL}/send-image`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending unofficial image:', error);
    throw error;
  }
};

export const sendAudio = async (data: SendMediaMessageDTO): Promise<UnofficialMessageResponse> => {
  try {
    // Garantir que o base64 não tenha o prefixo data:audio
    const base64File = data.base64File.replace(/^data:audio\/(wav|mpeg|mp3|ogg);base64,/, '');
    
    const payload = {
      base64File,
      fileName: data.fileName,
      mediaType: 'audio/wav', // Forçar o tipo como WAV
      recipient: data.recipient,
      sectorId: data.sectorId,
      caption: data.caption || ''
    };

    console.log('Enviando áudio para API:', {
      fileName: payload.fileName,
      mediaType: payload.mediaType,
      recipientLength: payload.recipient.length,
      base64Length: payload.base64File.length
    });

    const response = await axios.post<UnofficialMessageResponse>(`${UNOFFICIAL_API_URL}/send-audio`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Resposta da API de áudio:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending unofficial audio:', error);
    throw error;
  }
};

export const sendDocument = async (data: SendDocumentDTO): Promise<UnofficialMessageResponse> => {
  try {
    const payload = {
      base64File: data.base64File,
      fileName: data.fileName,
      mediaType: data.mediaType,
      recipient: data.recipient,
      sectorId: data.sectorId,
      caption: data.caption || ''
    };

    const response = await axios.post<UnofficialMessageResponse>(`${UNOFFICIAL_API_URL}/send-document`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending unofficial document:', error);
    throw error;
  }
};

// Função auxiliar para converter File/Blob para Base64
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      }
    };
    reader.onerror = error => reject(error);
  });
}; 