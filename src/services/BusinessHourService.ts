import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

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
    const response = await axios.post(`${API_URL}/businessHour`, businessHour);
    return response.data;
  } catch (error) {
    console.log(error)
  }
};

export const getBusinessHoursBySectorId = async (sectorId: number) => {
  try {
    const response = await axios.get(`${API_URL}/businessHour/${sectorId}`);
    return response.data;
  } catch (error) {
    console.log(error)
  }
};
