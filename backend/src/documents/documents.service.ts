/* eslint-disable */
import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentStatus } from './enums/document-status.enum';
import { DocumentType } from './enums/document-type.enum';
import { AiService } from '../gemini/ai.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly geminiService: AiService,
    private readonly storageService: StorageService,
  ) {}

  async upload(file: Express.Multer.File): Promise<Document> {
    this.logger.log(`Processing upload: ${file.originalname}`);

    const document = this.documentRepository.create({
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      documentType: DocumentType.UNKNOWN,
      status: DocumentStatus.PENDING,
      extractedData: null,
      errorMessage: null,
      confidenceScore: null,
    });

    const saved = await this.documentRepository.save(document);
    this.logger.log(`Document record created: ${saved.id}`);

    void this.processDocument(saved.id, file.path, file.mimetype);

    return saved;
  }

  private async processDocument(
    documentId: string,
    filePath: string,
    mimeType: string,
  ): Promise<void> {
    try {
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.PROCESSING,
      });

      const classification = await this.geminiService.classifyDocument(
        filePath,
        mimeType,
      );

      const documentType =
        classification?.documentType ?? DocumentType.UNKNOWN;
      const confidence = classification?.confidence ?? 0;

      const extractedData = await this.geminiService.extractFromDocument(
        filePath,
        mimeType,
        documentType,
      );

      await this.documentRepository.update(documentId, {
        documentType,
        status: DocumentStatus.COMPLETED,
        extractedData: extractedData as any,
        confidenceScore: confidence,
        errorMessage: null,
      });

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Document ${documentId} processing failed: ${String(error)}`);
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Processing failed',
      });
    }
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }
    return document;
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    this.storageService.deleteFile(document.filePath);
    await this.documentRepository.remove(document);
    this.logger.log(`Document ${id} deleted`);
  }

  async reprocess(id: string): Promise<Document> {
    const document = await this.findOne(id);
    if (!this.storageService.fileExists(document.filePath)) {
      throw new InternalServerErrorException('Original file no longer exists');
    }
    await this.documentRepository.update(id, {
      status: DocumentStatus.PENDING,
      extractedData: null,
      errorMessage: null,
      confidenceScore: null,
    });
    void this.processDocument(id, document.filePath, document.mimeType);
    return this.findOne(id);
  }
}
