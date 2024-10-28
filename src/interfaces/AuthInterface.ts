export interface SendVerificationCodeRequestDTO {
    email: string;
    phoneNumber: string;
  }
  
  export interface VerifyCodeRequestDTO {
    email: string;
    code: string;
  }