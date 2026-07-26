import { Injectable } from '@nestjs/common';
import { BaseExtractor } from './base.extractor';

@Injectable()
export class PayrollRecordExtractor extends BaseExtractor {
  extract(data: Record<string, unknown>): Record<string, unknown> {
    const payPeriod = this.safeObject(data.payPeriod);
    const otherDeductions = this.safeArray<Record<string, unknown>>(data.otherDeductions);

    return {
      employeeName: this.safeString(data.employeeName),
      employeeId: this.safeString(data.employeeId),
      employer: this.safeString(data.employer),
      payPeriod: payPeriod
        ? {
            from: this.safeString(payPeriod.from),
            to: this.safeString(payPeriod.to),
          }
        : null,
      paymentDate: this.safeString(data.paymentDate),
      grossPay: this.safeNumber(data.grossPay),
      netPay: this.safeNumber(data.netPay),
      taxDeducted: this.safeNumber(data.taxDeducted),
      nationalInsurance: this.safeNumber(data.nationalInsurance),
      pensionContribution: this.safeNumber(data.pensionContribution),
      otherDeductions: otherDeductions.map((d) => ({
        description: this.safeString(d.description),
        amount: this.safeNumber(d.amount),
      })),
      totalDeductions: this.safeNumber(data.totalDeductions),
      currency: this.safeString(data.currency),
      yearToDateGross: this.safeNumber(data.yearToDateGross),
      yearToDateNet: this.safeNumber(data.yearToDateNet),
      confidence: this.safeNumber(data.confidence),
    };
  }
}
