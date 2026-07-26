import { Injectable } from '@nestjs/common';
import { BaseExtractor } from './base.extractor';

@Injectable()
export class ExpenseVoucherExtractor extends BaseExtractor {
  extract(data: Record<string, unknown>): Record<string, unknown> {
    const lineItems = this.safeArray<Record<string, unknown>>(data.lineItems);

    return {
      voucherNumber: this.safeString(data.voucherNumber),
      claimantName: this.safeString(data.claimantName),
      department: this.safeString(data.department),
      expenseDate: this.safeString(data.expenseDate),
      submissionDate: this.safeString(data.submissionDate),
      expenseCategory: this.safeString(data.expenseCategory),
      description: this.safeString(data.description),
      lineItems: lineItems.map((item) => ({
        description: this.safeString(item.description),
        amount: this.safeNumber(item.amount),
        category: this.safeString(item.category),
      })),
      totalAmount: this.safeNumber(data.totalAmount),
      currency: this.safeString(data.currency),
      paymentMethod: this.safeString(data.paymentMethod),
      approvalStatus: this.safeString(data.approvalStatus),
      approvedBy: this.safeString(data.approvedBy),
      reimbursable: this.safeBoolean(data.reimbursable),
      confidence: this.safeNumber(data.confidence),
    };
  }
}
