export function buildInvoicePrompt(): string {
  return `You are a financial document extraction expert. Extract all relevant information from this invoice document.

Respond with a valid JSON object only. No explanation, no markdown, no code blocks. Just the raw JSON:

{
  "invoiceNumber": "string or null",
  "invoiceDate": "ISO 8601 date string or null",
  "dueDate": "ISO 8601 date string or null",
  "vendor": {
    "name": "string or null",
    "address": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "taxId": "string or null"
  },
  "billTo": {
    "name": "string or null",
    "address": "string or null",
    "email": "string or null"
  },
  "lineItems": [
    {
      "description": "string",
      "quantity": "number or null",
      "unitPrice": "number or null",
      "total": "number or null"
    }
  ],
  "subtotal": "number or null",
  "taxAmount": "number or null",
  "taxRate": "number or null",
  "discountAmount": "number or null",
  "totalAmount": "number or null",
  "currency": "string or null",
  "paymentTerms": "string or null",
  "paymentMethod": "string or null",
  "notes": "string or null",
  "confidence": 0.0 to 1.0
}`;
}
