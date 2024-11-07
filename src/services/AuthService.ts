import axios from 'axios'
import { SendVerificationCodeRequestDTO } from '../interfaces/AuthInterface';
import { VerifyCodeRequestDTO } from '../interfaces/AuthInterface';
import SessionService from './SessionService';

export const validateToken = async (token: string) => {
  try {
    const response = await axios.get(`/api/auth/validate`, { params: { token } });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to validate token: ${error}`);
  }
};

export const sendVerificationCode = async (data: SendVerificationCodeRequestDTO) => {
  try {
    const response = await axios.post('/api/auth/send-verification-code', data);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to send verification code: ${error}`);
  }
};

export const verifyCode = async (data: VerifyCodeRequestDTO) => {
  try {
    const response = await axios.post('/api/auth/verify-code', data);

    const token = response.data.token;
    if (token) {
      SessionService.setSession('authToken', token);
    }
  } catch (error) {
    throw new Error(`Failed to send verification code: ${error}`);
  }
}