import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { buildClassifyPrompt } from './prompts/classify.prompt';
import { buildInvoicePrompt } from './prompts/invoice.prompt';
import { buildContractPrompt } from './prompts/contract.prompt';
import { buildReportPrompt } from './prompts/report.prompt';
import { buildBankStatementPrompt } from './prompts/bank-statement.prompt';
import { buildExpenseVoucherPrompt } from './prompts/expense-voucher.prompt';
import { buildPayrollRecordPrompt } from './prompts/payroll-record.prompt';
import { DocumentType } from '../documents/enums/document-type.enum';
import { DocumentConverterService } from '../storage/document-converter.service';
import { ModelRankingService } from './model-ranking.service';
import { StorageService } from '../storage/storage.service';
import { ProviderLogsService } from '../provider-logs/provider-logs.service';

interface ClassifyResult {
  documentType: DocumentType;
  confidence: number;
  reasoning: string;
  provider: string;
}

interface ProviderResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  provider?: string;
  model?: string;
  rawResponse?: string;
  error?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

const TEXT_PROVIDER_PREFIX = 'openrouter:';
const VISION_PROVIDER_PREFIX = 'openrouter-vision:';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiClient: GoogleGenerativeAI | null = null;
  private readonly openRouterClient: OpenAI | null = null;
  private readonly geminiModel: string;
  private readonly openRouterModels: string[];
  private readonly maxFileSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly converterService: DocumentConverterService,
    private readonly storageService: StorageService,
    private readonly providerLogsService: ProviderLogsService,
    private readonly modelRankingService: ModelRankingService,
  ) {
    // Validate environment variables on startup
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!geminiKey && !openRouterKey) {
      this.logger.warn('No AI providers configured. Both Gemini and OpenRouter keys are missing.');
    }

    if (geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiKey);
      this.logger.log('Gemini provider initialised');
    }

    if (openRouterKey) {
      this.openRouterClient = new OpenAI({
        apiKey: openRouterKey,
        baseURL: this.configService.get<string>(
          'OPENROUTER_BASE_URL',
          'https://openrouter.ai/api/v1',
        ),
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/oviejeremiah/ClarityDocs',
          'X-Title': 'ClarityDocs',
        },
      });
      this.logger.log('OpenRouter provider initialised');
    }

    this.geminiModel = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-2.0-flash',
    );

    this.maxFileSize =
      this.configService.get<number>('MAX_FILE_SIZE_MB', 20) * 1024 * 1024;

    this.openRouterModels = [
      this.configService.get<string>(
        'OPENROUTER_MODEL_PRIMARY',
        'minimax/minimax-m3:free',
      ),
      this.configService.get<string>(
        'OPENROUTER_MODEL_FALLBACK',
        'google/gemma-4-31b-it:free',
      ),
      this.configService.get<string>(
        'OPENROUTER_MODEL_TERTIARY',
        'nvidia/nemotron-3-ultra-550b-a55b:free',
      ),
      this.configService.get<string>(
        'OPENROUTER_MODEL_QUATERNARY',
        'z-ai/glm-5.2:free',
      ),
    ];
  }

  /**
   * Validates file path to prevent path traversal attacks
   * Files can be in either the upload directory or OS temp directory
   * (temp is used when downloading from MinIO for AI processing)
   */
  private async validateFilePath(filePath: string): Promise<void> {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    // Files are read either from the configured upload directory or the OS
    // temp directory (used when downloading from MinIO for AI processing).
    const resolved = path.resolve(filePath);
    const uploadDir = path.resolve(
      this.configService.get<string>('UPLOAD_DIR', './uploads'),
    );
    const tempDir = path.resolve(os.tmpdir());

    if (!resolved.startsWith(uploadDir) && !resolved.startsWith(tempDir)) {
      throw new BadRequestException(
        'Access denied: File path outside allowed directory',
      );
    }

    // File type is already validated by FileValidationPipe at upload time.
    // No extension check here to avoid a second, divergent allow-list.
  }

  /**
   * Reads file safely with size validation
   */
  private async readFileSafely(filePath: string): Promise<Buffer> {
    await this.validateFilePath(filePath);
    
    const stat = await fs.promises.stat(filePath);
    if (stat.size > this.maxFileSize) {
      throw new BadRequestException(
        `File exceeds maximum size of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    return await fs.promises.readFile(filePath);
  }

  private parseJsonResponse(text: string): Record<string, unknown> {
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        } catch {
          // fall through
        }
      }
      this.logger.error(`Failed to parse JSON: ${cleaned.substring(0, 200)}`);
      throw new InternalServerErrorException('Failed to parse AI response');
    }
  }

  private buildPromptForType(documentType: DocumentType): string {
    switch (documentType) {
      case DocumentType.INVOICE:
        return buildInvoicePrompt();
      case DocumentType.CONTRACT:
        return buildContractPrompt();
      case DocumentType.REPORT:
        return buildReportPrompt();
      case DocumentType.BANK_STATEMENT:
        return buildBankStatementPrompt();
      case DocumentType.EXPENSE_VOUCHER:
        return buildExpenseVoucherPrompt();
      case DocumentType.PAYROLL_RECORD:
        return buildPayrollRecordPrompt();
      default:
        return buildReportPrompt();
    }
  }

  private async tryGeminiNative(
    filePath: string,
    mimeType: string,
    prompt: string,
  ): Promise<ProviderResult> {
    if (!this.geminiClient) {
      return { success: false, error: 'Gemini not configured' };
    }
    
    if (!this.storageService.isGeminiNative(mimeType)) {
      return { success: false, error: 'Not a Gemini-native format' };
    }

    const start = Date.now();
    try {
      this.logger.log(`Trying Gemini native (${this.geminiModel}) for ${mimeType}`);
      
      const model = this.geminiClient.getGenerativeModel({
        model: this.geminiModel,
      });

      const fileData = await this.readFileSafely(filePath);
      const base64Data = fileData.toString('base64');
      const geminiMime = this.storageService.getGeminiMimeType(mimeType);
      
      const filePart: Part = {
        inlineData: { data: base64Data, mimeType: geminiMime },
      };

      const result = await model.generateContent([prompt, filePart]);
      const text = result.response.text();
      const data = this.parseJsonResponse(text);
      const latencyMs = Date.now() - start;

      this.logger.log('Gemini native succeeded');
      void this.providerLogsService.log({
        operation: 'extraction',
        provider: this.geminiModel,
        success: true,
        latencyMs,
        estimatedInputTokens: Math.round(base64Data.length / 4),
        estimatedOutputTokens: Math.round(text.length / 4),
      });

      return { 
        success: true, 
        data, 
        provider: `gemini:${this.geminiModel}`,
        model: this.geminiModel,
        rawResponse: text,
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Gemini native failed: ${msg.substring(0, 150)}`);
      
      void this.providerLogsService.log({
        operation: 'extraction',
        provider: this.geminiModel,
        success: false,
        latencyMs,
        errorMessage: msg.substring(0, 500),
      });
      
      return { success: false, error: msg };
    }
  }

  private async tryOpenRouterWithText(
    textContent: string,
    prompt: string,
    modelName: string,
  ): Promise<ProviderResult> {
    if (!this.openRouterClient) {
      return { success: false, error: 'OpenRouter not configured' };
    }

    const start = Date.now();
    try {
      this.logger.log(`Trying OpenRouter text: ${modelName}`);
      
      const fullPrompt = `${prompt}\n\n---DOCUMENT CONTENT---\n${textContent.substring(0, 8000)}\n---END DOCUMENT---\n\nReturn valid JSON only. No explanation, no markdown.`;
      
      const response = await this.openRouterClient.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 4096,
        temperature: 0.1,
      });

      const text = response.choices[0]?.message?.content ?? '';
      const latencyMs = Date.now() - start;

      if (!text) {
        void this.providerLogsService.log({
          operation: 'extraction',
          provider: `openrouter:${modelName}`,
          success: false,
          latencyMs,
          errorMessage: 'Empty response',
        });
        return { success: false, error: 'Empty response' };
      }

      const data = this.parseJsonResponse(text);
      this.logger.log(`OpenRouter text ${modelName} succeeded`);
      
      void this.providerLogsService.log({
        operation: 'extraction',
        provider: `openrouter:${modelName}`,
        success: true,
        latencyMs,
        estimatedInputTokens: response.usage?.prompt_tokens,
        estimatedOutputTokens: response.usage?.completion_tokens,
      });

      return { 
        success: true, 
        data, 
        provider: `openrouter:${modelName}`,
        model: modelName,
        rawResponse: text,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        }
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`OpenRouter text ${modelName} failed: ${msg.substring(0, 150)}`);
      
      void this.providerLogsService.log({
        operation: 'extraction',
        provider: `openrouter:${modelName}`,
        success: false,
        latencyMs,
        errorMessage: msg.substring(0, 500),
      });
      
      return { success: false, error: msg };
    }
  }

  private async tryOpenRouterWithImage(
    filePath: string,
    mimeType: string,
    prompt: string,
    modelName: string,
  ): Promise<ProviderResult> {
    if (!this.openRouterClient) {
      return { success: false, error: 'OpenRouter not configured' };
    }

    const start = Date.now();
    try {
      this.logger.log(`Trying OpenRouter vision: ${modelName}`);
      
      const fileData = await this.readFileSafely(filePath);
      const base64Data = fileData.toString('base64');
      
      const response = await this.openRouterClient.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });

      const text = response.choices[0]?.message?.content ?? '';
      const latencyMs = Date.now() - start;

      if (!text) {
        void this.providerLogsService.log({
          operation: 'extraction',
          provider: `openrouter-vision:${modelName}`,
          success: false,
          latencyMs,
          errorMessage: 'Empty response',
        });
        return { success: false, error: 'Empty response' };
      }

      const data = this.parseJsonResponse(text);
      this.logger.log(`OpenRouter vision ${modelName} succeeded`);
      
      void this.providerLogsService.log({
        operation: 'extraction',
        provider: `openrouter-vision:${modelName}`,
        success: true,
        latencyMs,
        estimatedInputTokens: response.usage?.prompt_tokens,
        estimatedOutputTokens: response.usage?.completion_tokens,
      });

      return {
        success: true,
        data,
        provider: `openrouter-vision:${modelName}`,
        model: modelName,
        rawResponse: text,
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`OpenRouter vision ${modelName} failed: ${msg.substring(0, 150)}`);
      
      void this.providerLogsService.log({
        operation: 'extraction',
        provider: `openrouter-vision:${modelName}`,
        success: false,
        latencyMs,
        errorMessage: msg.substring(0, 500),
      });
      
      return { success: false, error: msg };
    }
  }

  private async getTextContent(
    filePath: string,
    mimeType: string,
  ): Promise<string | null> {
    try {
      await this.validateFilePath(filePath);
      const converted = await this.converterService.convertToText(
        filePath,
        mimeType,
      );
      return converted;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Text extraction failed: ${msg}`);
      return null;
    }
  }

  async classifyDocument(
    filePath: string,
    mimeType: string,
  ): Promise<ClassifyResult> {
    await this.validateFilePath(filePath);
    
    this.logger.log(`Classifying document: ${filePath} (${mimeType})`);
    const prompt = buildClassifyPrompt();
    const fileCategory = this.storageService.getFileCategory(mimeType);

    // 1st Priority: Extract text content for ALL document types (PDFs, images, office docs)
    // OpenRouter text models work with extracted text from any document format
    const textContent = await this.getTextContent(filePath, mimeType);
    if (textContent) {
      for (const model of this.openRouterModels) {
        const result = await this.tryOpenRouterWithText(
          textContent,
          prompt,
          model,
        );
        if (result.success && result.data) {
          return this.buildClassifyResult(result);
        }
      }
    }

    // 2nd Priority: For images only — try OpenRouter vision models
    if (fileCategory === 'image') {
      for (const model of this.openRouterModels) {
        const result = await this.tryOpenRouterWithImage(
          filePath,
          mimeType,
          prompt,
          model,
        );
        if (result.success && result.data) {
          return this.buildClassifyResult(result);
        }
      }
    }

    // 3rd Priority: For Gemini-native formats (PDF, images) — fallback to Gemini
    // Only used if text extraction AND vision models both fail
    if (fileCategory === 'pdf' || fileCategory === 'image') {
      const geminiResult = await this.tryGeminiNative(
        filePath,
        mimeType,
        prompt,
      );
      if (geminiResult.success && geminiResult.data) {
        return this.buildClassifyResult(geminiResult);
      }
    }

    this.logger.error('All AI providers failed for classification');
    throw new InternalServerErrorException(
      'Document classification failed — all AI providers exhausted',
    );
  }

  private buildClassifyResult(result: ProviderResult): ClassifyResult {
    const data = result.data ?? {};
    return {
      documentType: (data.documentType as DocumentType) ?? DocumentType.UNKNOWN,
      confidence: (data.confidence as number) ?? 0,
      reasoning: (data.reasoning as string) ?? '',
      provider: result.provider ?? 'unknown',
    };
  }

  async extractFromDocument(
    filePath: string,
    mimeType: string,
    documentType: DocumentType,
  ): Promise<Record<string, unknown>> {
    await this.validateFilePath(filePath);

    this.logger.log(
      `Extracting from ${documentType}: ${filePath} (${mimeType})`,
    );
    const prompt = this.buildPromptForType(documentType);
    const fileCategory = this.storageService.getFileCategory(mimeType);

    const textContent = await this.getTextContent(filePath, mimeType);
    if (textContent) {
      const textModels = await this.modelRankingService.rank(
        this.openRouterModels,
        TEXT_PROVIDER_PREFIX,
      );
      for (const model of textModels) {
        const result = await this.tryOpenRouterWithText(
          textContent,
          prompt,
          model,
        );
        if (result.success && result.data) {
          this.logger.log(`Extraction succeeded with text model: ${model}`);
          return result.data;
        }
      }
    }

    if (fileCategory === 'image') {
      const visionModels = await this.modelRankingService.rank(
        this.openRouterModels,
        VISION_PROVIDER_PREFIX,
      );
      for (const model of visionModels) {
        const result = await this.tryOpenRouterWithImage(
          filePath,
          mimeType,
          prompt,
          model,
        );
        if (result.success && result.data) {
          this.logger.log(`Extraction succeeded with vision model: ${model}`);
          return result.data;
        }
      }
    }

    if (fileCategory === 'pdf' || fileCategory === 'image') {
      const geminiResult = await this.tryGeminiNative(
        filePath,
        mimeType,
        prompt,
      );
      if (geminiResult.success && geminiResult.data) {
        this.logger.log('Extraction succeeded with Gemini fallback');
        return geminiResult.data;
      }
    }

    this.logger.error('All AI providers failed for extraction');
    throw new InternalServerErrorException(
      'Document extraction failed — all AI providers exhausted',
    );
  }

  async getRankingReport() {
    return this.modelRankingService.report(
      this.openRouterModels,
      TEXT_PROVIDER_PREFIX,
    );
  }

  getProviderStatus(): Record<string, any> {
    return {
      gemini: {
        configured: !!this.geminiClient,
        model: this.geminiModel,
        available: !!this.geminiClient,
      },
      openRouter: {
        configured: !!this.openRouterClient,
        models: this.openRouterModels,
        available: !!this.openRouterClient,
      },
      providers: {
        primary: this.openRouterClient ? 'OpenRouter' : 'Gemini',
        fallbackCount: this.openRouterModels.length,
      },
    };
  }
}

