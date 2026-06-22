import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types/document.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';
    return Promise.reject(
      new Error(Array.isArray(message) ? message.join(', ') : message),
    );
  },
);