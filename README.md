# NyayaTrace (NyayaSetu)

**A local, offline-first case management workspace for Indian legal professionals.**

NyayaTrace helps advocates and legal clerks organise court documents, extract and verify their content, track hearings and bail deadlines, and generate structured case reports — all on their own machine, without sending case data to a cloud service.

---

## Problem Statement

Indian advocates handling criminal and bail matters manage large volumes of physical and scanned documents — FIRs, chargesheets, bail orders, court proceedings — across multiple hearings. Manually cross-checking dates, party names, and statutory references across dozens of pages is time-consuming and error-prone. NyayaTrace provides a structured workspace to upload, process, and verify these documents, and to track the lifecycle of a case from remand to disposition.

---

## Main Features

| Feature | Status |
|---|---|
| Case creation and management (criminal, civil, bail, parole) | Implemented |
| Document upload with PDF/image processing and OCR | Implemented |
| Local case analysis with discrepancy detection | Implemented |
| Optional AI-assisted analysis (Gemini, OpenAI, Groq, OpenRouter, Ollama) | Implemented |
| Hearing timeline and cause list | Implemented |
| Statutory bail deadline calculator (CrPC s.167(2) / BNSS s.187) | Implemented |
| Bail conditions, surety bonds, compliance tracking | Implemented |
| IPC ↔ BNS section concordance with landmark judgments | Implemented |
| Case report and DOCX export | Implemented |
| Document verification workspace with annotations | Implemented |
| Case chat (AI, requires Gemini key) | Implemented |
| Analysis translation to regional languages | Implemented |
| Dashboard with KPIs and hearing activity chart | Implemented |
| Full-text search across case documents | Implemented |
| Progressive Web App (installable, offline pages) | Implemented (production only) |
| User authentication (DB-backed sessions, bcrypt) | Implemented |

---

## Technology Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** SQLite via `better-sqlite3` + Drizzle ORM
- **Styling:** Tailwind CSS 3 + shadcn/ui
- **OCR:** Tesseract.js + `@napi-rs/canvas` (local, no cloud)
- **PDF parsing:** PDF.js (`pdfjs-dist`)
- **AI providers:** Google Gemini, OpenAI, Groq, OpenRouter, Ollama (all optional)
- **Auth:** bcryptjs + DB sessions + HttpOnly cookie
- **Animations:** Framer Motion
- **Charts:** Recharts

---

## High-Level Architecture

```
Browser (React / Next.js App Router)
    │
    ├── App routes  app/(app)/…    — Protected workspace pages
    ├── Auth routes app/login …    — Login / signup / reset
    │
    └── API routes  app/api/…      — Next.js Route Handlers (Node.js runtime)
                                        │
                                        ├── lib/db/          Drizzle + SQLite
                                        ├── lib/ocr/         Tesseract + PDF.js
                                        ├── lib/analysis/    AI providers + local
                                        ├── lib/legal/       IPC/BNS static data
                                        └── lib/queries/     Reusable DB queries
```

All data stays on disk: SQLite at `nyayatrace.db`, uploaded files at `uploads/`.

For a detailed architecture diagram, see [`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md).

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later (LTS recommended) |
| npm | 9 or later |
| Operating System | Windows, macOS, or Linux |
| Git | Any recent version |

No Docker, no external database, no cloud account required for basic operation.

---

## Installation and Setup

```bash
# 1. Clone the repository
git clone https://github.com/sakshikri255/nyayatrace.git
cd nyayatrace

# 2. Install dependencies
npm install

# 3. Apply database migrations
npm run db:migrate

# 4. (Optional) Copy environment template
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
# Then edit .env.local and add API keys for AI features

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the login page.

**Demo credentials** (seeded automatically on first login attempt):

| Name | Email | Password |
|---|---|---|
| Aditi Sharma | aditi@nyayasetu.in | Demo@1234 |
| Rohan Mehta | rohan@nyayasetu.in | Demo@1234 |

---

## Environment Configuration

Copy `.env.example` to `.env.local` and fill in the values you need. All AI keys are optional.

```env
# Preferred AI provider (set at least one for AI analysis)
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.0-flash        # optional, has default

OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4o-mini             # optional, has default

GROQ_API_KEY=your-key-here
GROQ_MODEL=llama3-70b-8192           # use a currently valid Groq model name

OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=openai/gpt-4o-mini  # optional, has default

# Local Ollama (no API key required)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

See [`SETUP_AND_DEPLOYMENT.md`](SETUP_AND_DEPLOYMENT.md) for full setup instructions including troubleshooting.

---

## Development Commands

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint check

npm run db:migrate   # Apply pending migrations
npm run db:generate  # Generate new migration from schema changes
npm run db:push      # Push schema to DB without a migration file (dev only)
npm run db:seed-demo # Seed fictional demo cases
npm run db:remove-demo  # Remove demo seed data
```

---

## Testing

There is no automated test suite. See [`TESTING_AND_QUALITY.md`](TESTING_AND_QUALITY.md) for manual testing checklists and recommendations.

---

## Deployment

NyayaTrace is designed for **local deployment on a developer or advocate's machine**. It is not configured for multi-user public hosting. See [`SETUP_AND_DEPLOYMENT.md`](SETUP_AND_DEPLOYMENT.md) for deployment notes and security considerations.

---

## Documentation

| File | Description |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Instructions for AI coding agents working on this repository |
| [`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md) | Detailed architecture and data-flow diagrams |
| [`FEATURES.md`](FEATURES.md) | Full feature inventory |
| [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) | Database tables, fields, and relationships |
| [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) | API routes and request/response formats |
| [`SETUP_AND_DEPLOYMENT.md`](SETUP_AND_DEPLOYMENT.md) | Setup, environment variables, deployment |
| [`TESTING_AND_QUALITY.md`](TESTING_AND_QUALITY.md) | Testing checklists and quality guidance |
| [`SECURITY.md`](SECURITY.md) | Security practices and known limitations |
| [`CHANGELOG.md`](CHANGELOG.md) | Change history |
| [`ROADMAP.md`](ROADMAP.md) | Planned improvements |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution guidelines |
| [`HOW_BOB_WAS_USED_THROUGHOUT_THE_PROJECT.md`](HOW_BOB_WAS_USED_THROUGHOUT_THE_PROJECT.md) | IBM Bob usage during development |

---

## Important Notices

- **Do not expose this application publicly** without implementing proper access controls. The document-serving route is not an authentication boundary.
- **Use only authorized documents.** Upload only public records or records you are legally authorized to process.
- **AI analysis is not legal advice.** Output from AI providers must be reviewed by a qualified advocate before use in any legal proceeding.
- **OCR output contains errors.** Always verify extracted text against the original source document using the built-in document viewer.
