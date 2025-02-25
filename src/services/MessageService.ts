import axios from 'axios';
// Interfaces para as requisições
export interface SendMessageDto {
  to: string;
  recipientPhone: string;
  text: string;
  contactId: number;
  sectorId: number;
}

export interface SendFileDto {
  file: File;
  caption?: string;
  recipient: string;
  contactId: number;
  sectorId: number;
}

export interface MessageType {
  id: number;
  content: string | null;
  isSent: boolean;
  mediaType?: string;
  mediaUrl?: string | null;
  fileName?: string;
  sectorId?: number;
  contactID: number;
  isRead: boolean;
  sentAt?: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
}

// Função para enviar mensagem de texto
export const sendMessage = async (message: SendMessageDto): Promise<MessageType> => {
  try {
    if (!message.to || !message.text || !message.recipientPhone) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    const payload = {
      to: message.to,
      recipientPhone: message.recipientPhone,
      text: message.text,
      contactId: message.contactId,
      sectorId: message.sectorId
    };

    console.log('Enviando mensagem:', payload);

    const response = await axios.post('/whatsapp/send-message', payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
};

// Função para enviar arquivo
export const sendFile = async (fileData: SendFileDto): Promise<MessageType> => {
  try {
    const base64 = await fileToBase64(fileData.file);
    const response = await axios.post('/whatsapp/send-file', {
      base64File: base64,
      mediaType: determineMediaType(fileData.file),
      fileName: fileData.file.name,
      caption: fileData.caption || '',
      recipient: fileData.recipient,
      contactId: fileData.contactId,
      sectorId: fileData.sectorId
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    throw error;
  }
};

// Função para converter arquivo para base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove o prefixo data:image/jpeg;base64, do resultado
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Função para determinar o tipo de mídia
export const determineMediaType = (file: File): string => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];

  if (imageTypes.includes(file.type)) {
    return 'image';
  }
  if (audioTypes.includes(file.type)) {
    return 'audio';
  }
  return 'document';
};

// Função para normalizar mensagem
export const normalizeMessage = (message: MessageType): MessageType => {
  if (!message.mediaUrl && !message.attachment?.url) {
    return message;
  }

  if (message.mediaType === 'image' || message.mediaType === 'audio') {
    return {
      ...message,
      attachment: undefined
    };
  }

  if (message.mediaType === 'document' || message.attachment) {
    return {
      ...message,
      mediaUrl: null,
      attachment: {
        type: 'document',
        url: message.mediaUrl || message.attachment?.url || '',
        name: message.fileName || message.attachment?.name || 'arquivo'
      }
    };
  }

  return message;
};

// Função para buscar contatos
export const getWhatsAppContacts = async (sectorId: number): Promise<any[]> => {
  try {
    const response = await axios.get(`/server/api/whatsapp/contact/${sectorId}`);
    return response.data || [];
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return [];
  }
};

// Função para buscar mensagens de um contato
export const getMessagesByContactId = async (contactId: number): Promise<MessageType[]> => {
  try {
    const response = await axios.get(`/server/api/whatsapp/messages/${contactId}`);
    return response.data || [];
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return [];
  }
};

export const sendAudioMessage = async (
  audioBlob: Blob,
  recipient: string,
  contactId: number,
  sectorId: number
): Promise<any> => {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    
    const payload = {
      Base64File: base64Audio,
      MediaType: "audio/mpeg",
      FileName: `audio_${Date.now()}.mp3`,
      Caption: "",
      Recipient: recipient,
      ContactId: contactId,
      SectorId: sectorId
    };

    const response = await axios.post('/server/api/whatsapp/send-file', payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar áudio:", error);
    throw error;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
