/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { DocumentType } from './enums/document-type.enum';
import { DocumentStatus } from './enums/document-status.enum';
import { GeminiService } from '../gemini/gemini.service';
import { StorageService } from '../storage/storage.service';

const mockDocument: Document = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  originalName: 'invoice_001.pdf',
  filePath: 'uploads/uuid.pdf',
  fileSize: 102400,
  mimeType: 'application/pdf',
  documentType: DocumentType.INVOICE,
  status: DocumentStatus.COMPLETED,
  extractedData: { invoiceNumber: 'INV-001', totalAmount: 1500 },
  errorMessage: null,
  confidenceScore: 0.95,
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

const mockGeminiService = {
  classifyDocument: jest.fn(),
  extractFromDocument: jest.fn(),
};

const mockStorageService = {
  deleteFile: jest.fn(),
  fileExists: jest.fn(),
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
        { provide: GeminiService, useValue: mockGeminiService },
        { provide: StorageService, useValue: mockStorageService },
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
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        mockDocument.filePath,
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
    it('should throw error when file no longer exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);
      mockStorageService.fileExists.mockReturnValue(false);
      await expect(service.reprocess(mockDocument.id)).rejects.toThrow();
    });

    it('should reset document status and trigger reprocessing when file exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);
      mockStorageService.fileExists.mockReturnValue(true);
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
      });
      expect(result.status).toBe(DocumentStatus.PENDING);
    });
  });
});
