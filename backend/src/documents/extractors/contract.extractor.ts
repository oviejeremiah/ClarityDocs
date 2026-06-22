/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { BaseExtractor } from './base.extractor';

@Injectable()
export class ContractExtractor extends BaseExtractor {
  extract(data: Record<string, unknown>): Record<string, unknown> {
    const parties = this.safeArray<Record<string, unknown>>(data.parties);
    const keyTerms = this.safeArray<Record<string, unknown>>(data.keyTerms);
    const obligations = this.safeArray<Record<string, unknown>>(data.obligations);
    const signatures = this.safeArray<Record<string, unknown>>(data.signatures);
    const paymentTerms = this.safeObject(data.paymentTerms);

    return {
      contractTitle: this.safeString(data.contractTitle),
      contractType: this.safeString(data.contractType),
      effectiveDate: this.safeString(data.effectiveDate),
      expiryDate: this.safeString(data.expiryDate),
      parties: parties.map((p) => ({
        role: this.safeString(p.role),
        name: this.safeString(p.name),
        address: this.safeString(p.address),
        representative: this.safeString(p.representative),
      })),
      keyTerms: keyTerms.map((t) => ({
        term: this.safeString(t.term),
        description: this.safeString(t.description),
      })),
      obligations: obligations.map((o) => ({
        party: this.safeString(o.party),
        obligation: this.safeString(o.obligation),
      })),
      paymentTerms: paymentTerms
        ? {
            amount: this.safeNumber(paymentTerms.amount),
            currency: this.safeString(paymentTerms.currency),
            schedule: this.safeString(paymentTerms.schedule),
          }
        : null,
      terminationConditions: this.safeString(data.terminationConditions),
      governingLaw: this.safeString(data.governingLaw),
      confidentialityClause: this.safeBoolean(data.confidentialityClause),
      signatures: signatures.map((s) => ({
        party: this.safeString(s.party),
        signatory: this.safeString(s.signatory),
        date: this.safeString(s.date),
      })),
      summary: this.safeString(data.summary),
      confidence: this.safeNumber(data.confidence),
    };
  }
}
