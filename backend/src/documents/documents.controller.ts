/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('documents')
@UseGuards(JwtAuthGuard)
@Controller('api/documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload a document for AI processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Document accepted for processing', type: Document })
  @ApiResponse({ status: 400, description: 'Invalid file type or size. Accepted formats: PDF, JPEG, PNG, WEBP, GIF, CSV, XLSX, XLS, DOCX, TXT' })
  async upload(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ): Promise<Document> {
    this.logger.log(`Upload request received: ${file.originalname}`);
    return this.documentsService.upload(file);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all documents' })
  @ApiResponse({ status: 200, description: 'List of all documents', type: [Document] })
  findAll(): Promise<Document[]> {
    return this.documentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a document by ID' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document found', type: Document })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id') id: string): Promise<Document> {
    return this.documentsService.findOne(id);
  }

  @Post(':id/reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Reprocess a document through AI extraction' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 202, description: 'Document queued for reprocessing' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  reprocess(@Param('id') id: string): Promise<Document> {
    return this.documentsService.reprocess(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document and its file' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.documentsService.remove(id);
  }
}
