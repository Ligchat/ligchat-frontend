import axios from 'axios';
import SessionService from './SessionService';

// Usar a variável de ambiente sem concatenar uma porta específica
const WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL;

// Verificação de segurança para garantir que não estamos usando a porta 5002
const getApiUrl = () => {
  if (!WHATSAPP_API_URL) {
    return 'http://localhost:5001'; // URL padrão sem porta
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
  recipientPhone: string;
  text: string;
  contactId: number;
  sectorId: number;
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

// Função auxiliar para verificar se o setor é oficial
const validateOfficialSector = () => {
  const isOfficial = SessionService.getSectorIsOfficial();
  if (!isOfficial) {
    throw new Error('WhatsappService só pode ser usado com setores oficiais');
  }
};

export const sendMessage = async (data: SendMessageDto) => {
  try {
    validateOfficialSector();

    const payload = {
      text: data.text,
      to: data.to,
      recipientPhone: data.recipientPhone,
      contactId: data.contactId,
      sectorId: data.sectorId
    };

    console.log(`Enviando mensagem oficial para: ${API_URL}/whatsapp/send-message`);
    const response = await axios.post(`${API_URL}/whatsapp/send-message`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem oficial:', error);
    throw error;
  }
};

export const sendFile = async (data: SendFileRequest) => {
  try {
    validateOfficialSector();

    const payload = {
      base64File: data.base64File,
      mediaType: data.mediaType,
      fileName: data.fileName,
      caption: data.caption || '',
      recipient: data.recipient,
      contactId: data.contactId,
      sectorId: data.sectorId
    };

    console.log(`Enviando arquivo oficial para: ${API_URL}/whatsapp/send-file`);
    const response = await axios.post(`${API_URL}/whatsapp/send-file`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar arquivo oficial:', error);
    throw error;
  }
}; 