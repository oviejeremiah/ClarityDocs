import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UploadZone } from './UploadZone';

let uploadMutateMock = vi.fn();
let useUploadDocumentResult = {
  mutate: uploadMutateMock,
  isPending: false,
  error: null,
};

function useUploadDocumentMock() {
  return useUploadDocumentResult;
}

vi.mock('../../hooks/useUploadDocument', () => ({
  useUploadDocument: useUploadDocumentMock,
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('UploadZone', () => {
  beforeEach(() => {
    uploadMutateMock = vi.fn();
    useUploadDocumentResult = {
      mutate: uploadMutateMock,
      isPending: false,
      error: null,
    };
    vi.clearAllMocks();
  });

  it('renders the upload zone', () => {
    renderWithQuery(<UploadZone />);
    expect(
      screen.getByText(/drag and drop a pdf/i),
    ).toBeInTheDocument();
  });

  it('renders the choose file button', () => {
    renderWithQuery(<UploadZone />);
    expect(
      screen.getByRole('button', { name: /choose file/i }),
    ).toBeInTheDocument();
  });

  it('renders the supported formats hint', () => {
    renderWithQuery(<UploadZone />);
    expect(
      screen.getByText(/pdf.*jpeg.*png.*csv.*xlsx.*docx.*txt/i),
    ).toBeInTheDocument();
  });

  it('shows uploading state when pending', () => {
    uploadMutateMock = vi.fn();
    useUploadDocumentResult = {
      mutate: uploadMutateMock,
      isPending: true,
      error: null,
    };

    renderWithQuery(<UploadZone />);
    expect(
      screen.getByText(/uploading and queuing for ai processing/i),
    ).toBeInTheDocument();
  });
});