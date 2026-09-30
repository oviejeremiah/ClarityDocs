import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum';
import { DocumentStatus } from '../enums/document-status.enum';

@Entity('documents')
export class Document {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'invoice_2026_001.pdf' })
  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @ApiProperty({ example: 'minio://claritydocs/a1b2c3d4.pdf' })
  @Column({ type: 'varchar', length: 500 })
  storageKey: string;

  @ApiPropertyOptional({ example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4' })
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'file_hash' })
  fileHash: string | null;

  @ApiProperty({ example: 102400 })
  @Column({ type: 'int' })
  fileSize!: number;

  @ApiProperty({ example: 'application/pdf' })
  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.INVOICE })
  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.UNKNOWN,
  })
  documentType!: DocumentType;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.PENDING })
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status!: DocumentStatus;

  @ApiPropertyOptional({ example: { vendor: 'Acme Corp', total: 1500 } })
  @Column({ type: 'jsonb', nullable: true })
  extractedData!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: 'File could not be parsed' })
  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @ApiPropertyOptional({ example: 0.95 })
  @Column({ type: 'float', nullable: true })
  confidenceScore!: number | null;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false, name: 'needs_review' })
  needsReview: boolean;

  @ApiProperty({ example: '2026-06-21T10:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-21T10:00:00.000Z' })
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
