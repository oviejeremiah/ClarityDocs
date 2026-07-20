export const reportFixture = {
  documentText: `
QUARTERLY PERFORMANCE REPORT

Report Title: Q1 2026 Sales Performance Review
Prepared By: Sarah Chen, Head of Analytics
Organisation: Meridian Retail Group
Report Date: 2026-04-05
Reporting Period: 2026-01-01 to 2026-03-31

Executive Summary:
Sales performance exceeded targets in Q1 2026, driven by strong online conversion rates
and successful regional expansion into the Midlands.

Key Findings:
- Total revenue grew 18% year over year
- Online channel contributed 62% of total sales
- Customer retention improved to 74%

Key Metrics:
Revenue: £4.2 million (up)
New customers acquired: 3,150 (up)
Average order value: £68 (stable)

Recommendations:
- Increase marketing spend on the online channel
- Expand warehouse capacity in the Midlands region

Conclusion:
Q1 2026 results position the company well for continued growth in Q2.
`,
  groundTruth: {
    reportTitle: 'Q1 2026 Sales Performance Review',
    author: 'Sarah Chen',
    organisation: 'Meridian Retail Group',
    reportDate: '2026-04-05',
    periodFrom: '2026-01-01',
    periodTo: '2026-03-31',
    keyFindingsCount: 3,
    keyMetricsCount: 3,
    recommendationsCount: 2,
  },
};
