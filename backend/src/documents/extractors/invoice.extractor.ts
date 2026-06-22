import { Injectable } from '@nestjs/common';
import { BaseExtractor } from './base.extractor';

@Injectable()
export class InvoiceExtractor extends BaseExtractor {
  extract(data: Record<string, unknown>): Record<string, unknown> {
    const vendor = this.safeObject(data.vendor);
    const billTo = this.safeObject(data.billTo);
    const lineItems = this.safeArray<Record<string, unknown>>(data.lineItems);

    return {
      invoiceNumber: this.safeString(data.invoiceNumber),
      invoiceDate: this.safeString(data.invoiceDate),
      dueDate: this.safeString(data.dueDate),
      vendor: vendor
        ? {
            name: this.safeString(vendor.name),
            address: this.safeString(vendor.address),
            email: this.safeString(vendor.email),
            phone: this.safeString(vendor.phone),
            taxId: this.safeString(vendor.taxId),
          }
        : null,
      billTo: billTo
        ? {
            name: this.safeString(billTo.name),
            address: this.safeString(billTo.address),
            email: this.safeString(billTo.email),
          }
        : null,
      lineItems: lineItems.map((item) => ({
        description: this.safeString(item.description),
        quantity: this.safeNumber(item.quantity),
        unitPrice: this.safeNumber(item.unitPrice),
        total: this.safeNumber(item.total),
      })),
      subtotal: this.safeNumber(data.subtotal),
      taxAmount: this.safeNumber(data.taxAmount),
      taxRate: this.safeNumber(data.taxRate),
      discountAmount: this.safeNumber(data.discountAmount),
      totalAmount: this.safeNumber(data.totalAmount),
      currency: this.safeString(data.currency),
      paymentTerms: this.safeString(data.paymentTerms),
      paymentMethod: this.safeString(data.paymentMethod),
      notes: this.safeString(data.notes),
      confidence: this.safeNumber(data.confidence),
    };
  }
}
