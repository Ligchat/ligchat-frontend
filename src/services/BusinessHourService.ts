import axios from 'axios';

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
    const response = await axios.post('/server/businessHour', businessHour);
    return response.data;
  } catch (error) {
    console.log(error)
  }
};

export const getBusinessHoursBySectorId = async (sectorId: number) => {
  try {
    const response = await axios.get(`/server/businessHour/${sectorId}`);
    return response.data;
  } catch (error) {
    console.log(error)
  }
};
