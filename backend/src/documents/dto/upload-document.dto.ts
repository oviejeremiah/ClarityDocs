/// <reference types="express" />
/// <reference types="multer" />
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PDF document to upload and process (max 10MB)',
  })
  file!: Express.Multer.File;
}
