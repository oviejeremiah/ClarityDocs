export function buildClassifyPrompt(): string {
  return `You are a document classification expert. Analyse the provided document and classify it into exactly one of these categories:

- invoice: A bill, sales invoice, purchase invoice, or receipt from a vendor or supplier containing amounts, line items, and payment details
- contract: A legal agreement between two or more parties containing terms, conditions, obligations, and signatures
- report: A structured document presenting findings, analysis, data, or business information such as financial reports, audit reports, or status reports
- bank_statement: A statement issued by a bank showing an account holder's balance summary and transaction period for a bank account
- expense_voucher: An expense claim, expense reimbursement form, or expense receipt submitted by an employee for approval
- payroll_record: A payslip, pay stub, or payroll record showing an employee's gross pay, deductions, and net pay
- unknown: The document does not clearly fit any of the above categories

Respond with a valid JSON object only. No explanation, no markdown, no code blocks. Just the raw JSON:

{
  "documentType": "invoice" | "contract" | "report" | "bank_statement" | "expense_voucher" | "payroll_record" | "unknown",
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence explaining your classification"
}`;
}