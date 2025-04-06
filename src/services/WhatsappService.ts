import axios from 'axios';

// Usar a variável de ambiente sem concatenar uma porta específica
const WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL;

// Verificação de segurança para garantir que não estamos usando a porta 5002
const getApiUrl = () => {
  if (!WHATSAPP_API_URL) {
    return 'https://whatsapp.ligchat.com'; // URL padrão sem porta
  }
  
  // Remove a porta 5002 se ela estiver presente na URL
  if (WHATSAPP_API_URL.includes(':5002')) {
    console.warn('A porta 5002 foi detectada na URL do WhatsApp API. Removendo...');
    return WHATSAPP_API_URL.replace(':5002', '');
  }
  
  return WHATSAPP_API_URL;
};

const API_URL = getApiUrl();

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

    console.log(`Enviando mensagem para: ${API_URL}/whatsapp/send-message`);
    const response = await axios.post(`${API_URL}/whatsapp/send-message`, payload);
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

    console.log(`Enviando arquivo para: ${API_URL}/whatsapp/send-file`);
    const response = await axios.post(`${API_URL}/whatsapp/send-file`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar arquivo:', error);
    throw error;
  }
}; 