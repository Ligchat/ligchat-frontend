import axios from 'axios';

export interface WhatsAppContact {
    id: number;
    name: string;
    tagIds?: number[]; // Mudou para uma lista de inteiros
    phoneNumber: string; // Altera de phoneWhatsapp para phoneNumber
    address:string;
    profilePictureUrl?: string; // Ajustar para o nome correto
    email?: string; // Tornar opcional
    annotations?: string; // Tornar opcional
    status: number; // Altera de boolean para number
    sectorId?: number; // Tornar opcional
    createdAt: any;
    isRead:any
}

export interface Messages {
    id: number;
    content: string;
    mediaType?: string; // Tipo da mídia, opcional
    mediaUrl?: string; // URL da mídia, opcional
    sectorId: number; // ID do setor que enviou a mensagem
    contactId: number; // ID do contato que recebeu a mensagem
    sentAt?: Date; // Data/hora em que a mensagem foi enviada, opcional
}

export const getMessagesByContactId = async (contactId: number): Promise<Messages[]> => {
    try {
        const response = await axios.get(`/job/contact/${contactId}/messages`, {
            headers: {
                'Accept': '*/*',
            },
        });
        return response.data; // Ajustar de acordo com a estrutura de resposta do backend
    } catch (error) {
        console.error(`Failed to get messages for contact with ID ${contactId}:`, error);
        return []; // Retornar uma lista vazia em caso de erro
    }
};

// GET all WhatsApp contacts
export const getWhatsAppContacts = async (sectorId: number): Promise<WhatsAppContact[]> => {
    try {
        if(sectorId == null){
            sectorId = -1
        }
        const response = await axios.get(`/job/contact/sector/${sectorId}`, {
            headers: {
                'Accept': '*/*',
            },
        });
        return response.data; // Ajustar de acordo com a estrutura de resposta do backend
    } catch (error) {
        console.error(`Failed to get WhatsApp contacts:`, error);
        return []; // Retornar uma lista vazia em caso de erro
    }
};

// GET a WhatsApp contact by ID
export const getWhatsAppContactById = async (id: number): Promise<WhatsAppContact | null> => {
    try {
        const response = await axios.get(`/job/contact/${id}`, {
            headers: {
                'Accept': '*/*',
            },
        });
        return response.data; // Ajustar de acordo com a estrutura de resposta do backend
    } catch (error) {
        console.error(`Failed to get WhatsApp contact with ID ${id}:`, error);
        return null; // Retornar null em caso de erro
    }
};

// POST a new WhatsApp contact
export const createWhatsAppContact = async (contact: Omit<WhatsAppContact, 'id'>): Promise<void> => {
    try {
        await axios.post('/job/contact', contact, {
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(`Failed to create WhatsApp contact:`, error);
    }
};

// PUT to update a WhatsApp contact by ID
export const updateWhatsAppContact = async (contact: Omit<WhatsAppContact, 'id'>): Promise<void> => {
    try {
        await axios.post(`/job/contact`, contact, {
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(`Failed to update WhatsApp contact with ID:`, error);
    }
};

// DELETE a WhatsApp contact by ID
export const deleteWhatsAppContact = async (id: number): Promise<void> => {
    try {
        await axios.delete(`/job/contact/${id}`, {
            headers: {
                'Accept': '*/*',
            },
        });
    } catch (error) {
        console.error(`Failed to delete WhatsApp contact with ID ${id}:`, error);
    }
};
