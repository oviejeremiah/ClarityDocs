export function buildBankStatementPrompt(): string {
  return `You are a financial document extraction expert. Extract summary information from this bank statement. Do NOT list individual transactions — only extract the summary totals below.

Respond with a valid JSON object only. No explanation, no markdown, no code blocks. Just the raw JSON:

{
  "accountHolderName": "string or null",
  "accountNumber": "string or null (mask if partially visible, e.g. ****1234)",
  "bankName": "string or null",
  "statementPeriod": {
    "from": "ISO 8601 date string or null",
    "to": "ISO 8601 date string or null"
  },
  "previousBalance": "number or null — the balance carried forward from before this statement period",
  "totalMoneyIn": "number or null — sum of all deposits, credits, and bulk payments received during this period",
  "totalMoneyOut": "number or null — sum of all withdrawals, debits, and payments made during this period",
  "monthlyPayReceived": "number or null — if a recognisable regular salary or payroll credit appears, its amount, otherwise null",
  "currentBalance": "number or null — the closing balance at the end of this statement period",
  "currency": "string or null",
  "confidence": 0.0 to 1.0
}`;
}