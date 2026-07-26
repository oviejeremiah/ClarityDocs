export function buildExpenseVoucherPrompt(): string {
  return `You are a financial document extraction expert. Extract all relevant information from this expense voucher or expense claim document.

Respond with a valid JSON object only. No explanation, no markdown, no code blocks. Just the raw JSON:

{
  "voucherNumber": "string or null",
  "claimantName": "string or null",
  "department": "string or null",
  "expenseDate": "ISO 8601 date string or null",
  "submissionDate": "ISO 8601 date string or null",
  "expenseCategory": "string or null (e.g. Travel, Meals, Supplies, Accommodation)",
  "description": "string or null",
  "lineItems": [
    {
      "description": "string",
      "amount": "number or null",
      "category": "string or null"
    }
  ],
  "totalAmount": "number or null",
  "currency": "string or null",
  "paymentMethod": "string or null",
  "approvalStatus": "string or null (e.g. Approved, Pending, Rejected)",
  "approvedBy": "string or null",
  "reimbursable": "boolean",
  "confidence": 0.0 to 1.0
}`;
}