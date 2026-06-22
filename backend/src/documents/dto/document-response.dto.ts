import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum';
import { DocumentStatus } from '../enums/document-status.enum';

export class DocumentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() originalName!: string;
  @ApiProperty() fileSize!: number;
  @ApiProperty() mimeType!: string;
  @ApiProperty({ enum: DocumentType }) documentType!: DocumentType;
  @ApiProperty({ enum: DocumentStatus }) status!: DocumentStatus;
  @ApiPropertyOptional() extractedData!: Record<string, unknown> | null;
  @ApiPropertyOptional() errorMessage!: string | null;
  @ApiPropertyOptional() confidenceScore!: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
