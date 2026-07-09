import { apiClient } from './client';
import type { AuthResponse, LoginCredentials } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/api/auth/login',
      credentials,
    );
    return data;
  },
};
