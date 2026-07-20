import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('provider_logs')
export class ProviderLog {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional()
  @Column({ type: 'uuid', nullable: true, name: 'document_id' })
  documentId: string | null;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  operation: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  provider: string;

  @ApiProperty()
  @Column({ type: 'boolean' })
  success: boolean;

  @ApiProperty()
  @Column({ type: 'int', name: 'latency_ms' })
  latencyMs: number;

  @ApiPropertyOptional()
  @Column({ type: 'int', nullable: true, name: 'estimated_input_tokens' })
  estimatedInputTokens: number | null;

  @ApiPropertyOptional()
  @Column({ type: 'int', nullable: true, name: 'estimated_output_tokens' })
  estimatedOutputTokens: number | null;

  @ApiPropertyOptional()
  @Column({ type: 'float', nullable: true, name: 'estimated_cost_usd' })
  estimatedCostUsd: number | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}