import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentStatus } from './enums/document-status.enum';
import { DocumentType } from './enums/document-type.enum';
import { AiService } from '../gemini/ai.service';
import { StorageService } from '../storage/storage.service';
import { ObjectStorageService } from '../storage/object-storage.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly geminiService: AiService,
    private readonly storageService: StorageService,
    private readonly objectStorageService: ObjectStorageService,
    private readonly configService: ConfigService,
  ) {}

  async upload(file: Express.Multer.File): Promise<Document> {
    this.logger.log(`Processing upload: ${file.originalname}`);

    const { storageKey, fileHash } = await this.objectStorageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const document = this.documentRepository.create({
      originalName: file.originalname,
      storageKey,
      fileHash,
      fileSize: file.size,
      mimeType: file.mimetype,
      documentType: DocumentType.UNKNOWN,
      status: DocumentStatus.PENDING,
      extractedData: null,
      errorMessage: null,
      confidenceScore: null,
      needsReview: false,
    });

    const saved = await this.documentRepository.save(document);
    this.logger.log(`Document record created: ${saved.id}`);

    void this.processDocument(saved.id, storageKey, file.mimetype);

    return saved;
  }

  private async processDocument(
    documentId: string,
    storageKey: string,
    mimeType: string,
  ): Promise<void> {
    let tempFilePath: string | null = null;
    try {
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.PROCESSING,
      });

      const buffer = await this.objectStorageService.downloadFile(storageKey);
      tempFilePath = path.join(os.tmpdir(), `process-${documentId}`);
      fs.writeFileSync(tempFilePath, buffer);

      const classification = await this.geminiService.classifyDocument(
        tempFilePath,
        mimeType,
      );

      const extractedData = await this.geminiService.extractFromDocument(
        tempFilePath,
        mimeType,
        classification.documentType,
      );

      const reviewThreshold = this.configService.get<number>(
        'CONFIDENCE_REVIEW_THRESHOLD',
        0.75,
      );
      const needsReview = classification.confidence < reviewThreshold;

      await this.documentRepository.update(documentId, {
        documentType: classification.documentType,
        status: DocumentStatus.COMPLETED,
        extractedData: extractedData as unknown as object,
        confidenceScore: classification.confidence,
        needsReview,
        errorMessage: null,
      });

      if (needsReview) {
        this.logger.warn(
          `Document ${documentId} flagged for review — confidence ${Math.round(classification.confidence * 100)}% below threshold ${Math.round(reviewThreshold * 100)}%`,
        );
      }

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(
        `Document ${documentId} processing failed: ${String(error)}`,
      );
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Processing failed',
      });
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
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
    await this.objectStorageService.deleteFile(document.storageKey);
    await this.documentRepository.remove(document);
    this.logger.log(`Document ${id} deleted`);
  }

  async reprocess(id: string): Promise<Document> {
    const document = await this.findOne(id);
    await this.documentRepository.update(id, {
      status: DocumentStatus.PENDING,
      extractedData: null,
      errorMessage: null,
      confidenceScore: null,
      needsReview: false,
    });
    void this.processDocument(id, document.storageKey, document.mimeType);
    return this.findOne(id);
  }
}
