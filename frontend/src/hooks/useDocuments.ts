import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/documents.api';
import type { Document } from '../types/document.types';

export const DOCUMENTS_QUERY_KEY = ['documents'] as const;

export function useDocuments() {
  const { data, isLoading, isError, error, refetch } = useQuery<Document[], Error>({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: documentsApi.getAll,
    refetchInterval: 5000,
    staleTime: 0,
  });

  return {
    documents: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useDocument(id: string) {
  const { data, isLoading, isError, error, refetch } = useQuery<Document, Error>({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
    refetchInterval: 3000,
    staleTime: 0,
  });

  return { document: data, isLoading, isError, error, refetch };
}