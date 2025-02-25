import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Adicionando a variável de ambiente

interface ValidationResponse {
    message: string;
    details?: string;
}

export const validateMetaCredentials = async (accessToken: string, phoneNumberId: string): Promise<ValidationResponse> => {
    try {
        const response = await axios.get(`${API_URL}/job/Token/validate`, {
            params: { token: accessToken, phoneId: phoneNumberId },
        });

        return response.data; 
    } catch (error: any) {
        if (error.response) {
            return {
                message: error.response.data.message || 'Erro ao validar as credenciais.',
                details: error.response.data.details || '',
            };
        }
        // Erro de rede ou outro
        throw new Error('Erro de conexão ao validar credenciais.');
    }
}