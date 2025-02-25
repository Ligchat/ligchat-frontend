import axios from 'axios';

const WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL;

export interface WhatsAppContact {
    id: number;
    name: string;
    tagIds?: number[];
    phoneNumber: string;
    address: string;
    profilePictureUrl?: string;
    email?: string;
    annotations?: string;
    status: number;
    sectorId?: number;
    createdAt: string;
    isViewed: boolean;
    isRead: boolean;
    responsibleId?: number;
}

export interface Messages {
    id: number;
    content: string;
    mediaType?: string;
    mediaUrl?: string;
    sectorId: number;
    contactId: number;
    sentAt?: Date;
}

export const getMessagesByContactId = async (contactId: number): Promise<Messages[]> => {
    try {
        const response = await axios.get(`${WHATSAPP_API_URL}/messages/${contactId}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error(`Failed to get messages for contact with ID ${contactId}:`, error);
        return [];
    }
};

export const getWhatsAppContacts = async (sectorId: number): Promise<WhatsAppContact[]> => {
    try {
        const response = await axios.get(`${WHATSAPP_API_URL}/contacts/${sectorId}`);
        // Garante que sempre retornamos um array
        const contacts = Array.isArray(response.data) ? response.data : 
                        response.data?.data ? response.data.data : [];
                        
        return contacts.map((contact: any) => ({
            id: contact.id,
            name: contact.name || '',
            tagIds: contact.tagIds ? contact.tagIds.split(',').map(Number) : [],
            phoneNumber: contact.phoneNumber || '',
            address: contact.address || '',
            profilePictureUrl: contact.profilePictureUrl,
            email: contact.email,
            annotations: contact.annotations,
            status: contact.status || 0,
            sectorId: contact.sectorId,
            createdAt: contact.createdAt,
            isViewed: Boolean(contact.isViewed),
            isRead: Boolean(contact.isRead),
            responsibleId: contact.responsibleId
        }));
    } catch (error) {
        console.error(`Failed to get WhatsApp contacts:`, error);
        return [];
    }
};

// GET a WhatsApp contact by ID
export const getWhatsAppContactById = async (id: number): Promise<WhatsAppContact | null> => {
    try {
        const response = await axios.get(`${WHATSAPP_API_URL}/contact/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to get WhatsApp contact with ID ${id}:`, error);
        return null;
    }
};

// POST a new WhatsApp contact
export const createWhatsAppContact = async (contact: Omit<WhatsAppContact, 'id'>): Promise<void> => {
    try {
        await axios.post(`${WHATSAPP_API_URL}/contact`, contact);
    } catch (error) {
        console.error(`Failed to create WhatsApp contact:`, error);
    }
};

// PUT to update a WhatsApp contact by ID
export const updateWhatsAppContact = async (contact: Omit<WhatsAppContact, 'id'>): Promise<void> => {
    try {
        await axios.post(`${WHATSAPP_API_URL}/contact`, contact);
    } catch (error) {
        console.error(`Failed to update WhatsApp contact with ID:`, error);
    }
};

// DELETE a WhatsApp contact by ID
export const deleteWhatsAppContact = async (id: number): Promise<void> => {
    try {
        await axios.delete(`${WHATSAPP_API_URL}/contact/${id}`);
    } catch (error) {
        console.error(`Failed to delete WhatsApp contact with ID ${id}:`, error);
    }
};
