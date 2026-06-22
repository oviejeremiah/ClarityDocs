/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentType } from './enums/document-type.enum';
import { DocumentStatus } from './enums/document-status.enum';
import { Document } from './entities/document.entity';

const mockDocument: Document = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  originalName: 'invoice_001.pdf',
  filePath: 'uploads/uuid.pdf',
  fileSize: 102400,
  mimeType: 'application/pdf',
  documentType: DocumentType.INVOICE,
  status: DocumentStatus.COMPLETED,
  extractedData: { invoiceNumber: 'INV-001' },
  errorMessage: null,
  confidenceScore: 0.95,
  createdAt: new Date('2026-06-21T10:00:00.000Z'),
  updatedAt: new Date('2026-06-21T10:00:00.000Z'),
};

const mockFile: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'invoice_001.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 102400,
  path: 'uploads/uuid.pdf',
  destination: 'uploads',
  filename: 'uuid.pdf',
  buffer: Buffer.from(''),
  stream: null as never,
};

const mockDocumentsService = {
  upload: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  reprocess: jest.fn(),
};

describe('DocumentsController', () => {
  let controller: DocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it('should upload a file and return document', async () => {
      mockDocumentsService.upload.mockResolvedValue(mockDocument);
      const result = await controller.upload(mockFile);
      expect(mockDocumentsService.upload).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      mockDocumentsService.findAll.mockResolvedValue([mockDocument]);
      const result = await controller.findAll();
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      mockDocumentsService.findOne.mockResolvedValue(mockDocument);
      const result = await controller.findOne(mockDocument.id);
      expect(mockDocumentsService.findOne).toHaveBeenCalledWith(mockDocument.id);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('reprocess', () => {
    it('should reprocess a document', async () => {
      const reprocessed = { ...mockDocument, status: DocumentStatus.PENDING };
      mockDocumentsService.reprocess.mockResolvedValue(reprocessed);
      const result = await controller.reprocess(mockDocument.id);
      expect(mockDocumentsService.reprocess).toHaveBeenCalledWith(mockDocument.id);
      expect(result.status).toBe(DocumentStatus.PENDING);
    });
  });

  describe('remove', () => {
    it('should delete a document', async () => {
      mockDocumentsService.remove.mockResolvedValue(undefined);
      await controller.remove(mockDocument.id);
      expect(mockDocumentsService.remove).toHaveBeenCalledWith(mockDocument.id);
    });
  });
});
