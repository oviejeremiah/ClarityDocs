# ClarityDocs

> Turn documents into decisions.

ClarityDocs is a production-grade AI document intelligence platform that automatically extracts and structures data from PDF, DOCX, JPEG, PNG, CSV/XLSX, TXT invoices, contracts, reports, bank statements, expense vouchers and payroll records using Google Gemini 1.5 Flash.

## Live repository

[https://github.com/oviejeremiah/ClarityDocs](https://github.com/oviejeremiah/ClarityDocs)

## Tech stack

| Layer             | Technology                                 |
| ----------------- | ------------------------------------------ |
| Backend           | NestJS · TypeScript · TypeORM            |
| AI                | Google Gemini 1.5 Flash                    |
| Database          | PostgreSQL 16                              |
| Frontend          | React 18 · Vite · TypeScript             |
| State management  | TanStack React Query                       |
| File upload       | Multer · react-dropzone                   |
| API documentation | Swagger / OpenAPI                          |
| Testing           | Jest · Vitest · Testing Library          |
| Infrastructure    | Docker · Docker Compose · GitHub Actions |

## What it does

Staff upload a PDF document. ClarityDocs automatically:

1. Classifies the document type (invoice, contract, report)
2. Extracts all relevant structured fields using AI
3. Stores the results in a database
4. Displays extracted data in a clean, readable interface

No manual data entry. No copy-paste. Documents become structured, searchable data.

## Supported document types

| Type     | Extracted fields                                           |
| -------- | ---------------------------------------------------------- |
| Invoice  | Vendor, line items, totals, due date, payment terms        |
| Contract | Parties, key terms, obligations, governing law, signatures |
| Report   | Executive summary, key findings, metrics, recommendations  |

## Prerequisites

- Node.js v20 LTS
- Docker Desktop
- A free Google Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

## Quick start (Docker)

```bash
git clone https://github.com/oviejeremiah/ClarityDocs.git
cd ClarityDocs
```

Create a `.env` file at the root:



Then run:

```bash
docker-compose up --build
```

| Service      | URL                            |
| ------------ | ------------------------------ |
| Frontend     | http://localhost:80            |
| Backend API  | http://localhost:3000          |
| Swagger docs | http://localhost:3000/api/docs |

## Local development

### Backend

```bash
cd backend
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Database (Docker only)

```bash
docker-compose up postgres
```

## API endpoints

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| POST   | /api/documents/upload        | Upload and process a PDF |
| GET    | /api/documents               | Get all documents        |
| GET    | /api/documents/:id           | Get document by ID       |
| POST   | /api/documents/:id/reprocess | Reprocess a document     |
| DELETE | /api/documents/:id           | Delete a document        |

Full interactive documentation at `http://localhost:3000/api/docs`.

## Running tests

### Backend unit tests

```bash
cd backend && npm run test
```

### Frontend component tests

```bash
cd frontend && npx vitest run
```

### All tests

```bash
cd backend && npm run test && cd ../frontend && npx vitest run
```

**Test results: 25 tests passing across 5 suites, 0 failures.**

## Architecture decisions

**Google Gemini 1.5 Flash over LangChain** — Gemini reads PDFs natively with a 1 million token context window, eliminating the need for document chunking, embeddings, and retrieval pipelines. LangChain would add abstraction over a flow that does not need it. For projects requiring RAG or multi-agent orchestration, LangChain is the right tool — not here.

**Auto-detection of document type** — The system classifies the document type before extraction, then applies the appropriate structured prompt. Staff do not need to select a document type — they upload and results appear.

**Async processing** — Document upload returns immediately with a 202 Accepted response. AI processing runs in the background. The frontend polls every 5 seconds and updates automatically when processing completes.

**Extractor classes per document type** — Each document type has a dedicated extractor class that validates and sanitises the AI response before saving to the database. This ensures consistent data shape regardless of AI response variation.

**UUID primary keys** — Documents use UUID v4 primary keys rather than auto-increment integers, appropriate for distributed systems and regulated environments.

**Multi-stage Docker builds** — Both Dockerfiles use multi-stage builds for lean production images. The backend runs as a non-root user for security.
