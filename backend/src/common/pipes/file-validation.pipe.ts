import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

export const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'text/csv': 'CSV',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'DOCX',
  'application/msword': 'DOC',
  'text/plain': 'TXT',
};

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSizeBytes = 20 * 1024 * 1024;

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Accepted formats: PDF, JPEG, PNG, WebP, GIF, CSV, XLSX, DOCX, TXT`,
      );
    }
    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 20MB`,
      );
    }
    return file;
  }
}
