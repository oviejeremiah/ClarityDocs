/* eslint-disable */

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import { buildClassifyPrompt } from './prompts/classify.prompt';
import { buildInvoicePrompt } from './prompts/invoice.prompt';
import { buildContractPrompt } from './prompts/contract.prompt';
import { buildReportPrompt } from './prompts/report.prompt';
import { DocumentType } from '../documents/enums/document-type.enum';

interface ClassifyResult {
  documentType: DocumentType;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-1.5-flash',
    );
  }

  private buildFilePart(filePath: string, mimeType: string): Part {
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    return {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
  }

  private parseJsonResponse(text: string): Record<string, unknown> {
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      this.logger.error(`Failed to parse JSON response: ${cleaned}`);
      throw new InternalServerErrorException('Failed to parse AI response');
    }
  }

  async classifyDocument(
    filePath: string,
    mimeType: string,
  ): Promise<ClassifyResult> {
    this.logger.log(`Classifying document: ${filePath}`);
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const filePart = this.buildFilePart(filePath, mimeType);
      const result = await model.generateContent([
        buildClassifyPrompt(),
        filePart,
      ]);
      const text = result.response.text();
      const parsed = this.parseJsonResponse(text);
      this.logger.log(`Document classified as: ${String(parsed.documentType)}`);
      return {
        documentType: (parsed.documentType as DocumentType) ?? DocumentType.UNKNOWN,
        confidence: (parsed.confidence as number) ?? 0,
        reasoning: (parsed.reasoning as string) ?? '',
      };
    } catch (error) {
      this.logger.error(`Classification failed: ${String(error)}`);
      throw new InternalServerErrorException('Document classification failed');
    }
  }

  async extractFromDocument(
    filePath: string,
    mimeType: string,
    documentType: DocumentType,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Extracting data from ${documentType}: ${filePath}`);
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const filePart = this.buildFilePart(filePath, mimeType);
      let prompt: string;
      switch (documentType) {
        case DocumentType.INVOICE:
          prompt = buildInvoicePrompt();
          break;
        case DocumentType.CONTRACT:
          prompt = buildContractPrompt();
          break;
        case DocumentType.REPORT:
          prompt = buildReportPrompt();
          break;
        default:
          prompt = buildReportPrompt();
      }
      const result = await model.generateContent([
        prompt,
        filePart,
      ]);
      const text = result.response.text();
      const parsed = this.parseJsonResponse(text);
      this.logger.log(`Extraction complete for ${documentType}`);
      return parsed;
    } catch (error) {
      this.logger.error(`Extraction failed: ${String(error)}`);
      throw new InternalServerErrorException('Document extraction failed');
    }
  }
}
