import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types';

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<any, AuthResponse>('/auth/login', data);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<any, AuthResponse>('/auth/register', data);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<User> => {
    return await api.get<any, User>('/users/me');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return await api.put<any, User>('/users/me', data);
  },
};
