import axios from 'axios';
import * as UnofficialMessageService from './UnofficialMessageService';
import SessionService from './SessionService';

// Obter a URL da variável de ambiente
const WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL;
const UNOFFICIAL_API_URL = process.env.REACT_APP_UNOFFICIAL_API_URL || '/unofficial';
// Verificação de segurança para garantir que não estamos usando a porta 5002
const getApiUrl = () => {
  if (!WHATSAPP_API_URL) {
    return 'https://whatsapp.ligchat.com';
  }
  
  if (WHATSAPP_API_URL.includes(':5002')) {
    console.warn('A porta 5002 foi detectada na URL do WhatsApp API. Removendo...');
    return WHATSAPP_API_URL.replace(':5002', '');
  }
  
  return WHATSAPP_API_URL;
};

const API_URL = getApiUrl();

// Interface para a resposta da API
export interface MessageResponse {
  id: number;
  content: string | null;
  mediaType: string;
  mediaUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  sectorId: number;
  contactID: number;
  sentAt: string;
  isSent: boolean;
  isRead: boolean;
}

// Interfaces para as requisições
export interface SendMessageDto {
  to: string;
  recipientPhone: string;
  text: string;
  contactId: number;
  sectorId: number;
  userId: number;
  isAnonymous?: boolean;
  sentAt?: string;
  timezone?: string;
}

// Constantes para tipos de áudio suportados
const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav'];

export interface SendFileDto {
  file?: File;
  base64File?: string;
  fileName: string;
  mediaType: string;
  caption?: string;
  recipient: string;
  recipientPhone: string;
  contactId: number;
  sectorId: number;
  isHuman?: boolean;
  userId?: number;
  isAnonymous?: boolean;
  sentAt?: string;
  timezone?: string;
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

// Função para buscar mensagens de um contato
export const getMessagesByContactId = async (
  contactId: number,
  limit: number = 10,
  offset: number = 0
): Promise<MessageResponse[]> => {
  try {
    console.log(`[MessageService] Buscando mensagens para o contato ${contactId}, limit=${limit}, offset=${offset}`);
    const response = await axios.get<MessageResponse[]>(
      `${API_URL}/contact/${contactId}/messages`,
      {
        params: { limit, offset }
      }
    );
    
    // Logar a resposta original para debug
    console.log(`[MessageService] Resposta original do backend para contato ${contactId}:`, 
      JSON.stringify(response.data.slice(0, 2), null, 2)); // Mostra apenas as primeiras 2 mensagens para não poluir
    
    // NÃO converter para UTC - manter o valor original
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return [];
  }
};

// Função para enviar mensagem de texto
export const sendMessage = async (message: SendMessageDto): Promise<MessageResponse> => {
  try {
    if (!message.to || !message.text || !message.recipientPhone) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    const isOfficial = SessionService.getSectorIsOfficial();
    
    if (!isOfficial) {
      // Usar o serviço não oficial
      const unofficialResponse = await UnofficialMessageService.sendTextMessage({
        sector_id: message.sectorId,
        recipient: message.recipientPhone,
        message: message.text,
        userId: message.userId,
        isAnonymous: message.isAnonymous,
        sentAt: message.sentAt || new Date().toISOString(),
        ...(message.timezone ? { timezone: message.timezone } : {})
      });

      // Verificar se a resposta é válida
      if (!unofficialResponse || unofficialResponse.status === 'error') {
        throw new Error(unofficialResponse?.message || 'Erro ao enviar mensagem');
      }

      // Converter a resposta não oficial para o formato MessageResponse
      return {
        id: Date.now(), // ID temporário
        content: message.text, // Usar o texto original da mensagem
        mediaType: 'text',
        mediaUrl: null,
        fileName: null,
        mimeType: null,
        sectorId: message.sectorId,
        contactID: message.contactId,
        sentAt: unofficialResponse.timestamp || message.sentAt || new Date().toISOString(),
        isSent: unofficialResponse.status === 'success',
        isRead: false
      };
    }

    // Usar o serviço oficial
    const payload = {
      to: message.to,
      recipientPhone: message.recipientPhone,
      text: message.text,
      contactId: message.contactId,
      sectorId: message.sectorId,
      userId: message.userId,
      isAnonymous: message.isAnonymous,
      sentAt: message.sentAt || new Date().toISOString()
    };

    console.log(`Enviando mensagem para: ${API_URL}/whatsapp/send-message`);
    const response = await axios.post<MessageResponse>(`${API_URL}/whatsapp/send-message`, payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
};

// Função para enviar arquivo
export async function sendFile(fileData: SendFileDto): Promise<MessageResponse> {
  try {
    const isOfficial = SessionService.getSectorIsOfficial();

    if (!isOfficial) {
      let base64Data: string;
      let fileName: string;
      let mediaType: string;

      // Determina se é um arquivo base64 ou File
      if (fileData.base64File) {
        base64Data = fileData.base64File;
        fileName = fileData.fileName;
        mediaType = fileData.mediaType;
      } else if (fileData.file) {
        base64Data = await fileToBase64(fileData.file);
        fileName = fileData.file.name;
        mediaType = fileData.file.type;
      } else {
        throw new Error('Either base64File or file must be provided');
      }

      const isImage = mediaType.startsWith('image/');
      const isAudio = SUPPORTED_AUDIO_TYPES.some(type => mediaType.startsWith(type) || mediaType === type);
      const isDocument = !isImage && !isAudio;

      // Se for áudio, garantir que está em um formato suportado
      if (isAudio && !SUPPORTED_AUDIO_TYPES.includes(mediaType)) {
        throw new Error(`Unsupported audio format. Supported formats are: ${SUPPORTED_AUDIO_TYPES.join(', ')}`);
      }

      let response;
      if (isImage) {
        response = await UnofficialMessageService.sendImage({
          base64File: base64Data,
          fileName,
          mediaType,
          recipient: fileData.recipientPhone,
          sectorId: fileData.sectorId,
          caption: fileData.caption || '',
          userId: fileData.userId,
          isAnonymous: fileData.isAnonymous,
          sentAt: fileData.sentAt || new Date().toISOString()
        });
      } else if (isDocument) {
        response = await UnofficialMessageService.sendDocument({
          base64File: base64Data,
          fileName,
          mediaType,
          recipient: fileData.recipientPhone,
          sectorId: fileData.sectorId,
          caption: fileData.caption || '',
          userId: fileData.userId,
          isAnonymous: fileData.isAnonymous,
          sentAt: fileData.sentAt || new Date().toISOString()
        });
      } else {
        // Para áudio, sempre usar audio/mpeg como tipo
        response = await UnofficialMessageService.sendAudio({
          base64File: base64Data,
          fileName,
          mediaType: 'audio/mpeg',
          recipient: fileData.recipientPhone,
          sectorId: fileData.sectorId,
          caption: fileData.caption || '',
          userId: fileData.userId,
          isAnonymous: fileData.isAnonymous,
          sentAt: fileData.sentAt || new Date().toISOString()
        });
      }

      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to send file');
      }

      return {
        id: Date.now(),
        content: fileData.caption || null,
        mediaType: isImage ? 'image' : isAudio ? 'audio' : 'document',
        mediaUrl: null,
        fileName: fileName || null,
        mimeType: isAudio ? 'audio/mpeg' : mediaType || null,
        sectorId: fileData.sectorId,
        contactID: fileData.contactId,
        sentAt: response.timestamp || fileData.sentAt || new Date().toISOString(),
        isSent: response.status === 'success',
        isRead: false
      };
    }

    // Envio oficial
    if (!fileData.file) {
      throw new Error('File is required for official sending');
    }

    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('caption', fileData.caption || '');
    formData.append('recipient', fileData.recipient);
    formData.append('recipientPhone', fileData.recipientPhone);
    formData.append('contactId', fileData.contactId.toString());
    formData.append('sectorId', fileData.sectorId.toString());
    if (fileData.isHuman !== undefined) {
      formData.append('isHuman', fileData.isHuman.toString());
    }
    if (fileData.userId !== undefined) {
      formData.append('userId', String(fileData.userId));
    }
    if (fileData.isAnonymous !== undefined) {
      formData.append('isAnonymous', String(fileData.isAnonymous));
    }
    formData.append('sentAt', fileData.sentAt || new Date().toISOString());

    const response = await axios.post(
      `${getApiUrl()}/whatsapp/send-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${SessionService.getToken()}`
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error sending file:', error);
    throw error;
  }
}

// Função para converter WEBM para WAV
const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const wavBuffer = audioBufferToWav(audioBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      resolve(wavBlob);
    } catch (error) {
      console.error('Erro na conversão de áudio:', error);
      reject(error);
    }
  });
};

// Função para converter AudioBuffer para WAV
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChan * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write the PCM samples
  const channels = [];
  let offset = 44;
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      let sample = Math.max(-1, Math.min(1, channels[channel][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return arrayBuffer;
};

const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Função para enviar áudio
export const sendAudioMessage = async (
  audioBlob: Blob,
  recipient: string,
  contactId: number,
  sectorId: number,
  userId?: number,
  isAnonymous?: boolean,
  sentAt?: string
): Promise<MessageResponse> => {
  try {
    console.log('Áudio original:', {
      type: audioBlob.type,
      size: audioBlob.size
    });

    // Converter WEBM para WAV
    const wavBlob = await convertWebmToWav(audioBlob);
    const base64Audio = await blobToBase64(wavBlob);
    const isOfficial = SessionService.getSectorIsOfficial();
    
    if (!isOfficial) {
      const fileName = `audio_${Date.now()}.wav`;
      
      console.log('Enviando áudio convertido:', {
        fileName,
        mediaType: 'audio/wav'
      });

      const unofficialResponse = await UnofficialMessageService.sendAudio({
        base64File: base64Audio,
        fileName,
        mediaType: 'audio/wav',
        recipient,
        sectorId: sectorId,
        caption: '',
        userId: userId,
        isAnonymous: isAnonymous,
        sentAt: sentAt || new Date().toISOString()
      });

      if (unofficialResponse.status === 'error') {
        console.error('Erro na resposta do servidor:', unofficialResponse);
        throw new Error(unofficialResponse.message || 'Erro ao enviar áudio');
      }

      return {
        id: Date.now(),
        content: null,
        mediaType: 'audio',
        mediaUrl: null,
        fileName,
        mimeType: 'audio/wav',
        sectorId,
        contactID: contactId,
        sentAt: unofficialResponse.timestamp || sentAt || new Date().toISOString(),
        isSent: unofficialResponse.status === 'success',
        isRead: false
      };
    }
    
    // Criar um novo Blob com o áudio convertido
    const audioData = atob(base64Audio);
    const arrayBuffer = new ArrayBuffer(audioData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioData.length; i++) {
      uint8Array[i] = audioData.charCodeAt(i);
    }
    const mp3Blob = new Blob([uint8Array], { type: 'audio/mpeg' });

    // Usar o serviço oficial
    const formData = new FormData();
    formData.append('file', mp3Blob, `audio_${Date.now()}.mp3`);
    formData.append('caption', '');
    formData.append('recipient', recipient);
    formData.append('contactId', contactId.toString());
    formData.append('sectorId', sectorId.toString());
    if (userId !== undefined) {
      formData.append('userId', String(userId));
    }
    if (isAnonymous !== undefined) {
      formData.append('isAnonymous', String(isAnonymous));
    }
    formData.append('sentAt', sentAt || new Date().toISOString());

    const response = await axios.post<MessageResponse>(
      `${getApiUrl()}/whatsapp/send-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${SessionService.getToken()}`
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Erro detalhado ao enviar áudio:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Funções auxiliares
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        try {
          if (typeof reader.result === 'string') {
            const base64Data = reader.result.split(',')[1];
            if (!base64Data) {
              reject(new Error('Failed to extract base64 data'));
              return;
            }
            resolve(base64Data);
          } else {
            reject(new Error('Invalid file data'));
          }
        } catch (error) {
          reject(new Error('Error processing file data'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
    } catch (error) {
      reject(new Error('Error initializing file reader'));
    }
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64String = reader.result as string;
        // Remover qualquer prefixo de data URL existente
        const cleanBase64 = base64String.replace(/^data:audio\/(mp3|mpeg|wav|ogg);base64,/, '');
        resolve(cleanBase64);
      } catch (error) {
        reject(new Error('Erro ao processar áudio para base64'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de áudio'));
    reader.readAsDataURL(blob);
  });
};

export const determineMediaType = (file: File): string => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const audioTypes = SUPPORTED_AUDIO_TYPES;

  if (imageTypes.includes(file.type)) {
    return 'image';
  }
  if (audioTypes.includes(file.type)) {
    return 'audio';
  }
  return 'document';
};

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



