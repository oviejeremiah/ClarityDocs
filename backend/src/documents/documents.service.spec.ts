/// <reference types="jest" />
import { ObjectStorageService } from '../storage/object-storage.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { DocumentType } from './enums/document-type.enum';
import { DocumentStatus } from './enums/document-status.enum';
import { AiService } from '../gemini/ai.service';
import { StorageService } from '../storage/storage.service';

const mockDocument: Document = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  originalName: 'invoice_001.pdf',
  storageKey: 'abc123hash.pdf',
  fileHash: 'abc123hash',
  fileSize: 102400,
  mimeType: 'application/pdf',
  documentType: DocumentType.INVOICE,
  status: DocumentStatus.COMPLETED,
  extractedData: { invoiceNumber: 'INV-001', totalAmount: 1500 },
  errorMessage: null,
  confidenceScore: 0.95,
  needsReview: false,
  createdAt: new Date('2026-06-21T10:00:00.000Z'),
  updatedAt: new Date('2026-06-21T10:00:00.000Z'),
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAiService = {
  classifyDocument: jest.fn(),
  extractFromDocument: jest.fn(),
};

const mockStorageService = {
  deleteFile: jest.fn(),
  fileExists: jest.fn(),
};

const mockObjectStorageService = {
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  deleteFile: jest.fn(),
  getStorageUrl: jest.fn(),
};

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepository,
        },
        { provide: AiService, useValue: mockAiService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ObjectStorageService, useValue: mockObjectStorageService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(0.75) },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all documents ordered by createdAt DESC', async () => {
      mockRepository.find.mockResolvedValue([mockDocument]);
      const result = await service.findAll();
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockDocument]);
    });

    it('should return empty array when no documents exist', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);
      const result = await service.findOne(mockDocument.id);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockDocument.id },
      });
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the file and remove the document', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);
      mockRepository.remove.mockResolvedValue(mockDocument);
      await service.remove(mockDocument.id);
      expect(mockObjectStorageService.deleteFile).toHaveBeenCalledWith(
        mockDocument.storageKey,
      );
      expect(mockRepository.remove).toHaveBeenCalledWith(mockDocument);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reprocess', () => {
    it('should reset document status and trigger reprocessing', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);
      mockRepository.update.mockResolvedValue(undefined);
      const updatedDoc = { ...mockDocument, status: DocumentStatus.PENDING };
      mockRepository.findOne
        .mockResolvedValueOnce(mockDocument)
        .mockResolvedValueOnce(updatedDoc);
      const result = await service.reprocess(mockDocument.id);
      expect(mockRepository.update).toHaveBeenCalledWith(mockDocument.id, {
        status: DocumentStatus.PENDING,
        extractedData: null,
        errorMessage: null,
        confidenceScore: null,
        needsReview: false,
      });
      expect(result.status).toBe(DocumentStatus.PENDING);
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.reprocess('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
