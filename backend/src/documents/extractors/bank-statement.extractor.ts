import { Injectable } from '@nestjs/common';
import { BaseExtractor } from './base.extractor';

@Injectable()
export class BankStatementExtractor extends BaseExtractor {
  extract(data: Record<string, unknown>): Record<string, unknown> {
    const statementPeriod = this.safeObject(data.statementPeriod);

    return {
      accountHolderName: this.safeString(data.accountHolderName),
      accountNumber: this.safeString(data.accountNumber),
      bankName: this.safeString(data.bankName),
      statementPeriod: statementPeriod
        ? {
            from: this.safeString(statementPeriod.from),
            to: this.safeString(statementPeriod.to),
          }
        : null,
      previousBalance: this.safeNumber(data.previousBalance),
      totalMoneyIn: this.safeNumber(data.totalMoneyIn),
      totalMoneyOut: this.safeNumber(data.totalMoneyOut),
      monthlyPayReceived: this.safeNumber(data.monthlyPayReceived),
      currentBalance: this.safeNumber(data.currentBalance),
      currency: this.safeString(data.currency),
      confidence: this.safeNumber(data.confidence),
    };
  }
}
