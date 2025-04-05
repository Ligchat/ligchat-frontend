import axios from 'axios';
import { SendVerificationCodeRequestDTO } from '../interfaces/AuthInterface';
import { VerifyCodeRequestDTO } from '../interfaces/AuthInterface';
import SessionService from './SessionService';

const API_URL = process.env.REACT_APP_API_URL;

export const validateToken = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/auth/validate`, { params: { token } });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to validate token: ${error}`);
  }
};

export const sendVerificationCode = async (data: SendVerificationCodeRequestDTO) => {
  try {
    const response = await axios.post(`${API_URL}/auth/send-verification-code`, data);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to send verification code: ${error}`);
  }
};

export const verifyCode = async (data: VerifyCodeRequestDTO) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-code`, data);

    const token = response.data.token;
    if (token) {
      SessionService.setToken(token);
    }
    return response.data;
  } catch (error) {
    throw new Error(`Failed to send verification code: ${error}`);
  }
}