import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DocumentCard } from './DocumentCard';
import { DocumentType, DocumentStatus } from '../../types/document.types';
import type { Document } from '../../types/document.types';

const mockDocument: Document = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  originalName: 'invoice_001.pdf',
  fileSize: 102400,
  mimeType: 'application/pdf',
  documentType: DocumentType.INVOICE,
  status: DocumentStatus.COMPLETED,
  extractedData: { invoiceNumber: 'INV-001' },
  errorMessage: null,
  confidenceScore: 0.95,
  needsReview: false,
  createdAt: '2026-06-21T10:00:00.000Z',
  updatedAt: '2026-06-21T10:00:00.000Z',
};

vi.mock('../../hooks/useUploadDocument', () => ({
  useDeleteDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useReprocessDocument: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DocumentCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders document name', () => {
    renderWithProviders(<DocumentCard document={mockDocument} />);
    expect(screen.getByText('invoice_001.pdf')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderWithProviders(<DocumentCard document={mockDocument} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders type badge', () => {
    renderWithProviders(<DocumentCard document={mockDocument} />);
    expect(screen.getByText('Invoice')).toBeInTheDocument();
  });

  it('renders view results button for completed documents', () => {
    renderWithProviders(<DocumentCard document={mockDocument} />);
    expect(
      screen.getByRole('button', { name: /view results/i }),
    ).toBeInTheDocument();
  });

  it('shows confirm dialog when delete is clicked', () => {
    renderWithProviders(<DocumentCard document={mockDocument} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hides confirm dialog when cancel is clicked', () => {
    renderWithProviders(<DocumentCard document={mockDocument} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders confidence score', () => {
    renderWithProviders(<DocumentCard document={mockDocument} />);
    expect(screen.getByText(/95% confidence/i)).toBeInTheDocument();
  });
});