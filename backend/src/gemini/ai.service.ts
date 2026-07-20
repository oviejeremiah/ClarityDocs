import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import OpenAI from 'openai';
import * as fs from 'fs';
import { buildClassifyPrompt } from './prompts/classify.prompt';
import { buildInvoicePrompt } from './prompts/invoice.prompt';
import { buildContractPrompt } from './prompts/contract.prompt';
import { buildReportPrompt } from './prompts/report.prompt';
import { DocumentType } from '../documents/enums/document-type.enum';
import { DocumentConverterService } from '../storage/document-converter.service';
import { StorageService } from '../storage/storage.service';
import { ProviderLogsService } from '../provider-logs/provider-logs.service';

interface ClassifyResult {
  documentType: DocumentType;
  confidence: number;
  reasoning: string;
  provider: string;
}

interface ProviderResult {
  success: boolean;
  data?: Record<string, unknown>;
  provider?: string;
  error?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiClient: GoogleGenerativeAI | null = null;
  private readonly openRouterClient: OpenAI | null = null;
  private readonly geminiModel: string;
  private readonly openRouterModels: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly converterService: DocumentConverterService,
    private readonly storageService: StorageService,
    private readonly providerLogsService: ProviderLogsService,
  ) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY');

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

    this.openRouterModels = [
      this.configService.get<string>('OPENROUTER_MODEL_PRIMARY', 'gwen-5'),
      this.configService.get<string>(
        'OPENROUTER_MODEL_FALLBACK',
        'gwen-5.1-mini',
      ),
      this.configService.get<string>('OPENROUTER_MODEL_TERTIARY', 'gwen-4'),
    ];
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
    const fileData = fs.readFileSync(filePath);
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
    return { success: true, data, provider: `gemini:${this.geminiModel}` };
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
    return { success: true, data, provider: `openrouter:${modelName}` };
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
    try {
      this.logger.log(`Trying OpenRouter vision: ${modelName}`);
      const fileData = fs.readFileSync(filePath);
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
      if (!text) return { success: false, error: 'Empty response' };
      const data = this.parseJsonResponse(text);
      this.logger.log(`OpenRouter vision ${modelName} succeeded`);
      return {
        success: true,
        data,
        provider: `openrouter-vision:${modelName}`,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `OpenRouter vision ${modelName} failed: ${msg.substring(0, 150)}`,
      );
      return { success: false, error: msg };
    }
  }

  private async getTextContent(
    filePath: string,
    mimeType: string,
  ): Promise<string | null> {
    try {
      const converted = await this.converterService.convertToText(
        filePath,
        mimeType,
      );
      return converted;
    } catch {
      return null;
    }
  }

  async classifyDocument(
    filePath: string,
    mimeType: string,
  ): Promise<ClassifyResult> {
    this.logger.log(`Classifying document: ${filePath} (${mimeType})`);
    const prompt = buildClassifyPrompt();
    const fileCategory = this.storageService.getFileCategory(mimeType);

    // For images — try OpenRouter vision models first
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

    // For all formats — convert to text and use OpenRouter text models first
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

    // For Gemini-native formats (PDF, images) — fallback to Gemini
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
    this.logger.log(
      `Extracting from ${documentType}: ${filePath} (${mimeType})`,
    );
    const prompt = this.buildPromptForType(documentType);
    const fileCategory = this.storageService.getFileCategory(mimeType);

    // Image vision via OpenRouter first
    if (fileCategory === 'image') {
      for (const model of this.openRouterModels) {
        const result = await this.tryOpenRouterWithImage(
          filePath,
          mimeType,
          prompt,
          model,
        );
        if (result.success && result.data) return result.data;
      }
    }

    // Convert to text and use OpenRouter text models first
    const textContent = await this.getTextContent(filePath, mimeType);
    if (textContent) {
      for (const model of this.openRouterModels) {
        const result = await this.tryOpenRouterWithText(
          textContent,
          prompt,
          model,
        );
        if (result.success && result.data) return result.data;
      }
    }

    // Gemini-native (PDF, images) fallback
    if (fileCategory === 'pdf' || fileCategory === 'image') {
      const geminiResult = await this.tryGeminiNative(
        filePath,
        mimeType,
        prompt,
      );
      if (geminiResult.success && geminiResult.data) {
        return geminiResult.data;
      }
    }

    this.logger.error('All AI providers failed for extraction');
    throw new InternalServerErrorException(
      'Document extraction failed — all AI providers exhausted',
    );
  }
}
