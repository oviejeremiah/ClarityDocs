export function buildPayrollRecordPrompt(): string {
  return `You are a payroll document extraction expert. Extract all relevant information from this payslip or payroll record document.

Respond with a valid JSON object only. No explanation, no markdown, no code blocks. Just the raw JSON:

{
  "employeeName": "string or null",
  "employeeId": "string or null",
  "employer": "string or null",
  "payPeriod": {
    "from": "ISO 8601 date string or null",
    "to": "ISO 8601 date string or null"
  },
  "paymentDate": "ISO 8601 date string or null",
  "grossPay": "number or null",
  "netPay": "number or null",
  "taxDeducted": "number or null",
  "nationalInsurance": "number or null",
  "pensionContribution": "number or null",
  "otherDeductions": [
    {
      "description": "string",
      "amount": "number or null"
    }
  ],
  "totalDeductions": "number or null",
  "currency": "string or null",
  "yearToDateGross": "number or null",
  "yearToDateNet": "number or null",
  "confidence": 0.0 to 1.0
}`;
}