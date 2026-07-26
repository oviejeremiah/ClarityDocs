export enum DocumentType {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  REPORT = 'report',
  BANK_STATEMENT = 'bank_statement',
  EXPENSE_VOUCHER = 'expense_voucher',
  PAYROLL_RECORD = 'payroll_record',
  UNKNOWN = 'unknown',

}

export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Document {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  status: DocumentStatus;
  extractedData: Record<string, unknown> | null;
  errorMessage: string | null;
  confidenceScore: number | null;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UploadResponse = Document;

export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
}
