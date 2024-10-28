import axios from "axios";

export interface BusinessHourInterface {
  id?: number; 
  dayOfWeek: string;
  openingTime: string; 
  closingTime: string;
  isOpen: boolean;
  sectorId: number; 
}

export const createBusinessHour = async (businessHour: BusinessHourInterface) => {
  try {
    const response = await axios.post('/api/businessHour', businessHour);
    return response.data;
  } catch (error) {
    console.log(error)
  }
};

// Função para obter horários de funcionamento de um setor específico
export const getBusinessHoursBySectorId = async (sectorId: number) => {
  try {
    const response = await axios.get(`/api/businessHour/${sectorId}`);
    return response.data; // Retorna a lista de horários de funcionamento
  } catch (error) {
    console.log(error)
  }
};
