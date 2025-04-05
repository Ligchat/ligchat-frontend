import axios from 'axios';

const WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL;

export interface SendMessageDto {
  to: string;
  recipientNumber: string;
  text: string;
  message: string;
  contactId: number;
  sectorId: number;
  isHuman: boolean;
}

interface SendFileRequest {
  base64File: string;
  mediaType: string;
  fileName: string;
  caption: string;
  recipient: string;
  contactId: number;
  sectorId: number;
}

export const sendMessage = async (data: SendMessageDto) => {
  try {
    const payload = {
      message: data.text,
      to: data.to,
      recipientNumber: data.recipientNumber,
      contactId: data.contactId,
      sectorId: data.sectorId,
      isHuman: true
    };

    const response = await axios.post(`${WHATSAPP_API_URL}/whatsapp/send-message`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
};

export const sendFile = async (data: SendFileRequest) => {
  try {
    const payload = {
      base64File: data.base64File,
      mediaType: data.mediaType,
      fileName: data.fileName,
      caption: data.caption || '',
      recipient: data.recipient,
      contactId: data.contactId,
      sectorId: data.sectorId
    };

    const response = await axios.post(`${WHATSAPP_API_URL}/whatsapp/send-file`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar arquivo:', error);
    throw error;
  }
}; 