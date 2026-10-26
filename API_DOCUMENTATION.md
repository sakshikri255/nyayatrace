# API Documentation

This document covers all HTTP API routes in NyayaTrace. All routes are Next.js Route Handlers under `app/api/` with `export const runtime = 'nodejs'`.

> **Security notice:** Never expose real API keys, session tokens, or production data in requests or documentation. All examples use safe placeholder values.

---

## Authentication

Most API routes read the session cookie `nyayasetu_session` from the request. The middleware only checks for the cookie's presence — individual routes that require authentication call `getRequiredSession(request)` from [`lib/auth-server.ts`](lib/auth-server.ts), which validates the token against the `sessions` table.

Routes under `app/api/` are not blocked by the middleware (by design — see [`middleware.ts`](middleware.ts)). This means API routes are reachable without a browser session if the cookie is present in the request. Routes that need authentication must call `getRequiredSession` themselves.

> **Note:** Not all routes currently call `getRequiredSession`. This is a known security limitation — see [`SECURITY.md`](SECURITY.md).

---

## Auth Routes

### POST `/api/auth/login`

Authenticate a user and create a session.

**Request body:**
```json
{ "email": "user@example.com", "password": "password" }
```

**Success response (200):**
```json
{ "user": { "id": "abc123", "name": "Advocate Name", "email": "user@example.com", "role": "advocate" } }
```
Sets HttpOnly cookie `nyayasetu_session`.

**Error responses:**
- `400` — Missing email or password
- `401` — Invalid credentials

---

### POST `/api/auth/signup`

Create a new user account and session.

**Request body:**
```json
{ "name": "Advocate Name", "email": "user@example.com", "password": "password" }
```

**Success response (201):**
```json
{ "user": { "id": "abc123", "name": "Advocate Name", "email": "user@example.com", "role": "advocate" } }
```
Sets HttpOnly cookie `nyayasetu_session`.

**Error responses:**
- `400` — Missing required fields or email already registered

---

### POST `/api/auth/logout`

Destroy the current session.

**Success response (200):** `{}`

Clears the `nyayasetu_session` cookie.

---

### GET `/api/auth/me`

Return the current authenticated user.

**Success response (200):**
```json
{ "id": "abc123", "name": "Advocate Name", "email": "user@example.com", "role": "advocate" }
```

**Error responses:**
- `401` — No valid session

---

### POST `/api/auth/switch`

Switch the active user profile (for multi-account UI).

---

## Cases

### GET `/api/cases`

List all cases. Supports filtering and search.

**Query parameters:**
| Parameter | Type | Description |
|---|---|---|
| `search` | string | Filter by title or case number (partial match) |
| `status` | string | Filter by status: `active`, `closed`, `pending`, `stayed`, `unspecified` |
| `type` | string | Filter by type: `criminal`, `civil`, `bail`, `parole`, `unspecified` |

**Success response (200):** Array of case objects.

---

### POST `/api/cases`

Create a new case.

**Request body:**
```json
{
  "title": "State vs. Accused Name",
  "caseNumber": "CR-2024-001",
  "caseType": "criminal",
  "status": "active",
  "court": "District Court, Delhi",
  "jurisdiction": "Delhi",
  "judge": "Hon. Justice Name",
  "advocate": "Advocate Name",
  "remandDate": "2024-07-15",
  "statutoryPeriodDays": 60,
  "chargesheetFiled": false,
  "applicableLaw": "auto"
}
```

**Success response (201):** Created case object.

**Error responses:**
- `400` — Missing title or invalid `caseType`/`status`
- `409` — Case number already exists

---

### GET `/api/cases/[id]`

Get a single case by ID.

**Success response (200):** Case object.

**Error responses:**
- `400` — Invalid ID
- `404` — Case not found

---

### PATCH `/api/cases/[id]`

Update a case.

**Request body:** Partial case fields.

**Success response (200):** Updated case object.

---

### DELETE `/api/cases/[id]`

Delete a case and all related data (cascade).

**Success response (200):** `{}`

---

### GET `/api/cases/[id]/analysis`

Get analysis runs for a case, including status, AI provider availability, and run history.

**Success response (200):**
```json
{
  "current": true,
  "aiProviderConfigured": true,
  "aiProviders": {
    "gemini": true,
    "openai": false,
    "groq": false,
    "openrouter": false,
    "ollama": false
  },
  "latestRunId": 12,
  "runs": [ /* array of analysis run objects with synopsis and findings */ ]
}
```

---

### POST `/api/cases/[id]/analysis`

Trigger a new analysis run.

**Request body:**
```json
{
  "useAi": true,
  "aiProvider": "gemini",
  "language": "English"
}
```

`useAi`: `false` for local-only extraction. `aiProvider`: `gemini`, `openai`, `groq`, `openrouter`, or `ollama`.

**Success response (201):** Analysis run object with synopsis and findings.

**Error responses:**
- `400` — No documents or invalid ID
- `409` — Analysis already running; documents not yet processed
- `503` — AI provider not configured

---

### GET `/api/cases/[id]/analysis/[runId]`

Get a specific analysis run by run ID.

---

### POST `/api/cases/[id]/analysis/translate`

Translate the analysis of a specific run.

**Request body:** `{ "language": "Hindi", "runId": 12 }`

---

### GET `/api/cases/[id]/bail-brief`

Get the complete bail brief data for a case (case details, statutory bail calculation, conditions, surety bonds, hearings, orders, UTP relief).

**Success response (200):** Bail brief data object.

---

### POST `/api/cases/[id]/bail-draft/generate`

Generate a draft bail application for a case.

**Success response (201):** Bail draft object with content and version.

---

### GET `/api/cases/[id]/brief`

Get the case brief data for report generation.

---

### GET/POST `/api/cases/[id]/changelog`

Get or create changelog entries for a case.

---

### GET/POST `/api/cases/[id]/chat`

Get chat history or send a new chat message for a case (AI-powered, requires Gemini key).

**POST request body:**
```json
{
  "message": "What are the key dates in this case?",
  "history": [ /* prior messages */ ]
}
```

**Success response (200):**
```json
{
  "reply": "The key dates found in the case documents are...",
  "citations": [
    { "documentId": 1, "documentName": "FIR.pdf", "pageNumber": 2, "quote": "..." }
  ]
}
```

**Error responses:**
- `503` — Gemini not configured

---

### GET `/api/cases/[id]/chronology`

Get the extracted hearing chronology for a case.

---

### PATCH/DELETE `/api/cases/[id]/conditions/[conditionId]`

Update or delete a bail condition.

### POST `/api/cases/[id]/conditions/[conditionId]/compliance`

Record a compliance or violation event for a bail condition.

### POST `/api/cases/[id]/conditions/[conditionId]/surety`

Add or update a surety bond for a bail condition.

---

### GET `/api/cases/[id]/detective-wall`

Get the detective investigation wall data for a case.

---

### GET `/api/cases/[id]/draft`

Get draft content for a case.

---

### POST `/api/cases/[id]/legal-sections/detect`

Auto-detect legal sections from case documents.

**Success response (200):**
```json
{
  "caseId": 5,
  "detectedAt": "2024-10-26T12:00:00.000Z",
  "totalSections": 3,
  "sections": [
    {
      "section": "302",
      "law": "IPC",
      "count": 4,
      "offense": "Murder",
      "bailable": "Non-Bailable",
      "provisionDescription": "...",
      "caseRelevance": "Section IPC (Murder) was referenced 4 times in \"FIR.pdf\".",
      "detectionSource": "document_text",
      "landmarkJudgments": [ /* array */ ],
      "judgmentsVerified": true
    }
  ],
  "warning": null
}
```

---

### GET `/api/cases/[id]/legal-sections/extracted`

Get previously extracted legal sections for a case.

---

### GET/POST `/api/cases/[id]/orders`

Get or create judicial orders for a case.

---

### GET `/api/cases/[id]/temporal-analysis`

Get temporal contradiction analysis for a case.

---

### GET `/api/cases/[id]/utp-relief`

Get UTP (Under-Trial Prisoner) relief eligibility data for a case.

---

## Documents

### GET `/api/documents?caseId=<id>`

List all documents for a case.

**Query parameters:** `caseId` (required)

---

### POST `/api/documents`

Upload a document for a case. Accepts `multipart/form-data`.

**Form fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | PDF, JPEG, or PNG (max 20 MB) |
| `caseId` | string | Yes | Numeric case ID |
| `language` | string | No | OCR language code (default: `eng`) |

**Success response (201):** Document object with processing status.

**Error responses:**
- `400` — Missing fields or magic byte mismatch
- `404` — Case not found
- `409` — Duplicate file
- `413` — File too large
- `415` — Unsupported file type

---

### GET `/api/documents/[id]`

Get a document record by ID.

### DELETE `/api/documents/[id]`

Delete a document and its pages.

### GET `/api/documents/[id]/file`

Serve the raw document file from the `uploads/` directory.

### POST `/api/documents/[id]/reprocess-page`

Trigger re-OCR for a specific page.

---

## Findings

### GET `/api/findings?caseId=<id>`

List findings for a case.

### POST `/api/findings`

Create a manual finding.

### GET `/api/findings/[id]`

Get a finding with its sources.

### PATCH `/api/findings/[id]`

Update a finding (review status, notes).

### DELETE `/api/findings/[id]`

Delete a finding.

---

## Hearings

### GET `/api/hearings?caseId=<id>`

List hearings for a case.

### POST `/api/hearings`

Create a hearing.

**Request body:**
```json
{
  "caseId": 5,
  "hearingDate": "2024-11-15",
  "eventType": "bail_hearing",
  "description": "Bail hearing before Sessions Court",
  "outcome": "Bail rejected",
  "judge": "Hon. Justice Name"
}
```

### GET/PATCH/DELETE `/api/hearings/[id]`

Get, update, or delete a hearing.

### GET `/api/hearings/chart`

Get monthly hearing count data for the activity chart.

---

## Legal Sections

### GET `/api/legal-sections?q=<query>`

Search or browse legal sections.

**Query parameters:**
| Parameter | Description |
|---|---|
| `q` | Search query (section number or offense name) |
| `text` | Free text to auto-detect sections from (returns detected sections) |

---

### GET `/api/legal-sections/concordance`

Get concordance data with optional filters.

**Query parameters:**
| Parameter | Description |
|---|---|
| `q` | Search query |
| `from` | `ipc`, `bns`, `crpc`, or `bnss` for exact mapping lookup |
| `category` | `offense`, `procedure`, or `evidence` |
| `bailable` | `true` or `false` |

---

## Annotations

### GET `/api/annotations?caseId=<id>`

List annotations for a case (optionally filtered by `documentId` or `pageNumber`).

### POST `/api/annotations`

Create an annotation.

**Request body:**
```json
{
  "caseId": 5,
  "documentId": 3,
  "pageNumber": 2,
  "selectedText": "The accused was seen at...",
  "note": "Alibi conflict — FIR says different location",
  "tag": "alibi",
  "color": "rose"
}
```

### PATCH/DELETE `/api/annotations/[id]`

Update or delete an annotation.

---

## Overview

### GET `/api/overview`

Get dashboard statistics (KPI counts, recent cases, monthly hearing chart data).

**Success response (200):**
```json
{
  "stats": { "total": 12, "active": 5, "pending": 3, "closed": 4 },
  "recentCases": [ /* up to 5 cases */ ],
  "chartData": [ /* monthly hearing counts */ ]
}
```

### GET `/api/overview/alerts`

Get active alerts for the dashboard.

---

## Cause List

### GET `/api/cause-list`

Get upcoming hearing events for the cause list board.

---

## Search

### GET `/api/search?q=<query>`

Full-text search across document pages and findings.

**Query parameters:**
| Parameter | Description |
|---|---|
| `q` | Search query (minimum 2 characters) |
| `caseId` | Optional — restrict search to a specific case |

**Success response (200):**
```json
{
  "query": "accused name",
  "total": 5,
  "results": [
    {
      "id": "page-123",
      "type": "page",
      "caseId": 5,
      "caseNumber": "CR-2024-001",
      "caseTitle": "State vs. Accused",
      "documentId": 3,
      "documentName": "FIR.pdf",
      "pageNumber": 2,
      "snippet": "...the accused name was found at..."
    }
  ]
}
```

---

## Translation

### POST `/api/translate`

Translate an array of text strings to a target language.

**Request body:**
```json
{ "texts": ["Accused arrested on", "Station House Officer"], "targetLanguage": "Hindi" }
```

**Success response (200):**
```json
{ "translations": ["अभियुक्त को गिरफ्तार किया गया", "थाना प्रभारी"] }
```

**Error responses:**
- `503` — No AI provider configured

---

## System

### GET `/api/system/health`

Health check endpoint.

**Success response (200):** `{ "status": "ok" }`

---

## Error Format

All error responses follow the same format:

```json
{ "error": "Human-readable error message" }
```

Common HTTP status codes:
| Code | Meaning |
|---|---|
| `400` | Bad request — validation error |
| `401` | Unauthorized — no valid session |
| `404` | Not found |
| `409` | Conflict — duplicate or in-progress operation |
| `413` | Payload too large |
| `415` | Unsupported media type |
| `500` | Internal server error |
| `503` | Service unavailable — AI provider not configured |
