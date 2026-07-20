export const invoiceFixture = {
  documentText: `
INVOICE

Acme Consulting Ltd
42 Baker Street, London, W1U 6TQ
VAT: GB123456789

Bill To:
Northwind Trading Co
15 Elm Avenue, Manchester, M1 2AB

Invoice Number: INV-2026-0472
Invoice Date: 2026-03-14
Due Date: 2026-04-13

Description                Qty    Unit Price    Total
Consulting Services         10      £150.00     £1,500.00
Software Licence Fee         1      £299.00       £299.00

Subtotal:                                       £1,799.00
Tax (20%):                                        £359.80
Total Amount Due:                               £2,158.80

Payment Terms: Net 30
Payment Method: Bank Transfer
`,
  groundTruth: {
    invoiceNumber: 'INV-2026-0472',
    invoiceDate: '2026-03-14',
    dueDate: '2026-04-13',
    vendorName: 'Acme Consulting Ltd',
    billToName: 'Northwind Trading Co',
    subtotal: 1799.0,
    taxAmount: 359.8,
    totalAmount: 2158.8,
    currency: 'GBP',
    paymentTerms: 'Net 30',
  },
};
