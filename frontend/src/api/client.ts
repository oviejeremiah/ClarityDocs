import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types/document.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('clarity_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clarity_token');
      localStorage.removeItem('clarity_user');
      window.location.href = '/login';
    }
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';
    return Promise.reject(
      new Error(Array.isArray(message) ? message.join(', ') : message),
    );
  },
);
