/* eslint-disable */
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = ['application/pdf'];
  private readonly maxSizeBytes = 10 * 1024 * 1024;

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Only PDF files are accepted`,
      );
    }
    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB`,
      );
    }
    return file;
  }
}
