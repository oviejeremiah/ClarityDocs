import { apiClient } from './client';
import type { Document, UploadResponse } from '../types/document.types';

const BASE = '/api/documents';

export const documentsApi = {
  getAll: async (): Promise<Document[]> => {
    const { data } = await apiClient.get<Document[]>(BASE);
    return data;
  },

  getById: async (id: string): Promise<Document> => {
    const { data } = await apiClient.get<Document>(`${BASE}/${id}`);
    return data;
  },

  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<UploadResponse>(
      `${BASE}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  reprocess: async (id: string): Promise<Document> => {
    const { data } = await apiClient.post<Document>(`${BASE}/${id}/reprocess`);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};