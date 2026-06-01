import axiosClient from './axiosClient';

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  // Dòng này ĐÃ ĐÚNG rồi, không cần sửa
register: (data: RegisterData) => axiosClient.post('api/auth/register', data),
login: (data: LoginData) => axiosClient.post('api/auth/login', data),
getMe: () => axiosClient.get('api/auth/me'),
};