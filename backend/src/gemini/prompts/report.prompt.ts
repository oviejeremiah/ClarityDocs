export function buildReportPrompt(): string {
  return `You are a business document extraction expert. Extract all relevant information from this report document.

Respond with a valid JSON object only. No explanation, no markdown, no code blocks. Just the raw JSON:

{
  "reportTitle": "string or null",
  "reportType": "string or null",
  "author": "string or null",
  "organisation": "string or null",
  "reportDate": "ISO 8601 date string or null",
  "reportingPeriod": {
    "from": "ISO 8601 date string or null",
    "to": "ISO 8601 date string or null"
  },
  "executiveSummary": "string or null",
  "keyFindings": [
    "string"
  ],
  "keyMetrics": [
    {
      "name": "string",
      "value": "string",
      "unit": "string or null",
      "trend": "up | down | stable | null"
    }
  ],
  "recommendations": [
    "string"
  ],
  "sections": [
    {
      "title": "string",
      "summary": "string"
    }
  ],
  "conclusions": "string or null",
  "confidence": 0.0 to 1.0
}`;
}
