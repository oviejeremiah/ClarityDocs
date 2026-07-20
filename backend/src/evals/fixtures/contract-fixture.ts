export const contractFixture = {
  documentText: `
SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of 2026-01-15 between:

Party A: Bright Path Technologies Ltd ("Provider")
Party B: Coastal Retail Group Ltd ("Client")

Effective Date: 2026-02-01
Expiry Date: 2027-01-31

1. Scope of Services
Provider shall deliver ongoing software maintenance and support services to Client.

2. Payment Terms
Client shall pay Provider £4,500 per month, payable within 14 days of invoice receipt.

3. Termination
Either party may terminate this Agreement with 60 days written notice.

4. Governing Law
This Agreement shall be governed by the laws of England and Wales.

5. Confidentiality
Both parties agree to maintain strict confidentiality of all shared information.

Signed:
For Provider: J. Whitfield, Director
For Client: M. Osei, Operations Manager
`,
  groundTruth: {
    contractTitle: 'Service Agreement',
    effectiveDate: '2026-02-01',
    expiryDate: '2027-01-31',
    partyAName: 'Bright Path Technologies Ltd',
    partyBName: 'Coastal Retail Group Ltd',
    paymentAmount: 4500,
    paymentCurrency: 'GBP',
    governingLaw: 'England and Wales',
    confidentialityClause: true,
  },
};
