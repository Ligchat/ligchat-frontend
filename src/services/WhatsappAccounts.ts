import axios from '../axiosConfig';

export interface WhatsAppAccount {
    id: number;
    sessionId: string;
    isConnected: boolean;
    qrCode: string;
}

export const getWhatsAppAccount = async (sectorId: string): Promise<WhatsAppAccount> => {
    try {
        const response = await axios.get(`/api/whatsapp/account/${sectorId}`, {
            headers: {
                'Accept': '*/*',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to get WhatsApp account with sessionId ${sectorId}: ${error}`);
    }
};
