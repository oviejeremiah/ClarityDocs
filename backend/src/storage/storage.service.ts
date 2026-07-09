import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export type FileCategory =
  | 'pdf'
  | 'image'
  | 'csv'
  | 'spreadsheet'
  | 'document'
  | 'text';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  getFileCategory(mimeType: string): FileCategory {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'text/csv') return 'csv';
    if (
      mimeType === 'application/vnd.ms-excel' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
      return 'spreadsheet';
    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    )
      return 'document';
    if (mimeType === 'text/plain') return 'text';
    return 'document';
  }

  getGeminiMimeType(mimeType: string): string {
    const supported: Record<string, string> = {
      'application/pdf': 'application/pdf',
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
      'image/png': 'image/png',
      'image/webp': 'image/webp',
      'image/gif': 'image/gif',
    };
    return supported[mimeType] ?? 'application/pdf';
  }

  isGeminiNative(mimeType: string): boolean {
    const native = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    return native.includes(mimeType);
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}: ${String(error)}`);
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  getFileSizeBytes(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  readFileAsBase64(filePath: string): string {
    return fs.readFileSync(filePath).toString('base64');
  }

  readFileAsText(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  readFileAsBuffer(filePath: string): Buffer {
    return fs.readFileSync(filePath);
  }
}
