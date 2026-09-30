import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../gemini/ai.service';
import { DocumentType } from '../documents/enums/document-type.enum';
import { scoreExtraction, EvalResult } from './scorer';
import { invoiceFixture } from './fixtures/invoice-fixture';
import { contractFixture } from './fixtures/contract-fixture';
import { reportFixture } from './fixtures/report-fixture';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface EvalSummary {
  overallAccuracy: number;
  results: EvalResult[];
  timestamp: string;
}

@Injectable()
export class EvalsService {
  private readonly logger = new Logger(EvalsService.name);

  constructor(private readonly aiService: AiService) {}

  private writeTempTextFile(text: string): string {
    const tempPath = path.join(os.tmpdir(), `eval-${Date.now()}.txt`);
    fs.writeFileSync(tempPath, text, 'utf-8');
    return tempPath;
  }

  async runAll(): Promise<EvalSummary> {
    this.logger.log('Running evaluation suite against all fixtures');
    const results: EvalResult[] = [];

    const fixtures: Array<{
      type: DocumentType;
      data: { documentText: string; groundTruth: Record<string, unknown> };
    }> = [
      { type: DocumentType.INVOICE, data: invoiceFixture },
      { type: DocumentType.CONTRACT, data: contractFixture },
      { type: DocumentType.REPORT, data: reportFixture },
    ];

    for (const fixture of fixtures) {
      const tempPath = this.writeTempTextFile(fixture.data.documentText);
      try {
        const extracted = await this.aiService.extractFromDocument(
          tempPath,
          'text/plain',
          fixture.type,
        );
        const provider = (extracted._provider as string) ?? 'unknown';
        const result = scoreExtraction(
          fixture.data.groundTruth,
          extracted,
          fixture.type,
          provider,
        );
        results.push(result);
        this.logger.log(
          `${fixture.type}: ${result.accuracyPercent}% accuracy`,
        );
      } catch (error) {
        this.logger.error(
          `Eval failed for ${fixture.type}: ${String(error)}`,
        );
        results.push({
          documentType: fixture.type,
          provider: 'none',
          fieldScores: [],
          accuracyPercent: 0,
        });
      } finally {
        fs.unlinkSync(tempPath);
      }
    }

    const overallAccuracy = Math.round(
      results.reduce((sum, r) => sum + r.accuracyPercent, 0) / results.length,
    );

    return {
      overallAccuracy,
      results,
      timestamp: new Date().toISOString(),
    };
  }

  getModelRanking() {
    return this.aiService.getRankingReport();
  }
}
