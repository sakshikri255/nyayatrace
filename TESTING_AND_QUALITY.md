# Testing and Quality

This document describes how to validate NyayaTrace and outlines both existing quality checks and recommended tests that have not yet been implemented.

---

## Current State

**There is no automated test suite** in this repository. Quality assurance is performed through:
1. TypeScript type-checking (catches type errors at compile time)
2. ESLint (catches code style and common mistakes)
3. Next.js production build (catches build-time errors)
4. Manual testing (functional validation)

---

## Existing Quality Commands

Run these commands before committing any change:

```bash
# 1. Lint — catches ESLint rule violations
npm run lint

# 2. Type-check — catches TypeScript type errors without emitting output
npx tsc --noEmit

# 3. Production build — catches build-time errors and bundle issues
npm run build
```

All three must pass with no errors before a change is considered complete.

### ESLint Configuration

ESLint is configured in [`.eslintrc.json`](.eslintrc.json) using `eslint-config-next`. Rules cover React hooks, accessibility, and Next.js-specific patterns.

### TypeScript Configuration

TypeScript is configured in [`tsconfig.json`](tsconfig.json) with strict settings inherited from Next.js defaults.

---

## Manual Testing Checklists

Use these checklists to verify important workflows manually.

### Authentication

- [ ] Visit `http://localhost:3000` — should redirect to `/login`
- [ ] Visit a protected route (`/overview`) without logging in — should redirect to `/login?next=/overview`
- [ ] Log in with `aditi@nyayasetu.in` / `Demo@1234` — should land on the overview
- [ ] Log out — should redirect to `/login`
- [ ] Sign up with a new email — should create account and redirect to overview
- [ ] After login, the sidebar should display the correct user name and role

### Case Management

- [ ] Create a new criminal case with all required fields — should appear in the case list
- [ ] Create a case without a title — should show a validation error
- [ ] Create a case with a duplicate case number — should show a 409 error
- [ ] Edit a case's title and court — changes should persist after page reload
- [ ] Delete a case — should remove it from the list and cascade-delete all documents, hearings, etc.
- [ ] Filter cases by status — results should update correctly
- [ ] Search for a case by case number — results should match

### Document Upload and Processing

- [ ] Upload a text-based PDF — should complete with status `complete` and show readable page count
- [ ] Upload a scanned image PDF — should attempt OCR and complete (or fail if OCR cannot read it)
- [ ] Upload a JPEG image — should OCR the image and complete
- [ ] Upload a file larger than 20 MB — should be rejected with an appropriate error
- [ ] Upload a file with a `.pdf` extension but wrong contents — should be rejected with a magic byte error
- [ ] Upload the same PDF twice to the same case — second upload should be rejected with a duplicate error
- [ ] After upload, the Documents tab should show the document with page count and status

### Analysis

- [ ] Run a local analysis on a case with processed documents — should complete and show findings
- [ ] Run a local analysis on a case with no documents — should show an error
- [ ] Run a local analysis on a case where documents are still processing — should show an error
- [ ] If a Gemini key is configured, run AI analysis — should complete and show an executive summary
- [ ] If no AI key is configured, the AI analysis button should be disabled or show a configuration message
- [ ] Analysis run history should show previous runs
- [ ] Inconsistencies should appear in the Findings tab with status `Needs Review`

### Legal Sections

- [ ] Open the Legal Sections tab for a case with documents — click "Auto-Detect"
- [ ] Detected sections should show section number, law, offense, and bailability
- [ ] Clicking a section's concordance link should navigate to `/concordance?section=...`
- [ ] Expanding a section should show landmark judgments (if any exist in the static library)
- [ ] Search on `/concordance` for "302" — should return the Murder entry
- [ ] Filter concordance by "Non-Bailable" — should exclude bailable sections

### Bail Brief

- [ ] Open Bail Briefs for a bail-type case with a remand date
- [ ] Statutory bail card should show days in custody, deadline, and progress
- [ ] For a case remanded after 2024-07-01, applicable law should default to BNSS
- [ ] For a case remanded before 2024-07-01, applicable law should default to CrPC
- [ ] Add a bail condition — should appear in the conditions table
- [ ] Record a compliance event — should appear in the condition history
- [ ] Add a surety bond — should appear in the surety panel

### Verification Workspace

- [ ] Open a case with documents in the Verification workspace
- [ ] Document viewer should show extracted page text
- [ ] Navigate between pages — text should update
- [ ] Add an annotation to a page — should appear in the annotations panel
- [ ] Change annotation tag and color — should persist
- [ ] Delete an annotation — should disappear
- [ ] If a Gemini key is configured, open the case chat — ask a question and verify a response

### Search

- [ ] Open the Command Palette (`Ctrl+K`)
- [ ] Search for a word known to appear in an uploaded document — should return page results
- [ ] Search for a word in a finding description — should return findings
- [ ] Clicking a result should navigate to the relevant case or document

### Reports

- [ ] Open a report for a case with documents, hearings, and findings
- [ ] The case brief should render with all sections
- [ ] Click "Export to Word" — a `.docx` file should download
- [ ] Print preview should show a clean, formatted document

---

## Recommended Tests (Not Yet Implemented)

These are tests that would significantly improve project reliability. They do not currently exist.

### Unit Tests

| Test | File to Test | Framework (recommended) |
|---|---|---|
| `calculateStatutoryBail` — verify CrPC/BNSS cutoff logic | `lib/analysis/statutoryBail.ts` | Vitest |
| `detectScriptFromText` — verify Hindi, Bengali, Tamil detection | `lib/ocr/index.ts` | Vitest |
| `extractSections` — verify IPC/BNS section detection from text | `lib/analysis/sectionExtractor.ts` | Vitest |
| `cleanOcrRegex` / `isCorruptedText` — verify OCR cleaning | `lib/legalSanitizer.ts` | Vitest |
| `generateStoryAndDossier` — verify story does not contain raw OCR | `lib/legalSanitizer.ts` | Vitest |
| File upload validation — magic byte checks | `app/api/documents/route.ts` | Vitest |
| SHA-256 duplicate detection | `app/api/documents/route.ts` | Vitest |

### Integration Tests

| Test | Scope |
|---|---|
| POST `/api/auth/login` with valid and invalid credentials | Auth routes |
| POST `/api/cases` — validation errors and successful creation | Cases API |
| POST `/api/documents` — file validation and processing status | Documents API |
| POST `/api/cases/[id]/analysis` — local analysis run end-to-end | Analysis API |
| GET `/api/legal-sections/concordance` — search and filter | Legal sections API |
| GET `/api/search` — full-text search results | Search API |

### End-to-End Tests

| Workflow | Tool (recommended) |
|---|---|
| Login → create case → upload document → run analysis | Playwright |
| Bail brief: create case with remand date → verify deadline calculation | Playwright |
| Legal sections: upload document with IPC references → auto-detect | Playwright |

### Legal-Research-Specific Tests

Given the legal context of this application, these tests are particularly important:

1. **Source verification:** AI-suggested citations must cite a passage that literally exists on the cited page. Test that `parseGroundedAIAnalysis` in `lib/analysis/openai.ts` correctly rejects or flags citations where the quoted text is absent from the page.

2. **Unavailable judgments:** The landmark judgments library includes a `verificationNote` field for entries whose full text is not publicly available. Test that the UI correctly renders this note and does not present unverified judgments as authoritative.

3. **Statutory bail boundary:** Test that the BNSS cutoff date (2024-07-01) is correctly applied for auto-detection. A remand date of `2024-06-30` should use CrPC; `2024-07-01` should use BNSS.

4. **Duplicate finding suppression:** When AI-generated inconsistencies duplicate locally-detected ones, the merge step should deduplicate. Test that `potentialInconsistencies` in the merged synopsis does not contain exact duplicates.

5. **OCR quality flags:** Test that pages with Tesseract confidence below 45% are marked `poor` (not `good`) and that pages with fewer than 15 characters are marked `unreadable`.

---

## Regression Testing Guidelines

When making changes to:

- **`lib/legalSanitizer.ts`** — manually test local extraction on at least one real-world OCR output to verify story quality.
- **`lib/analysis/synopsis.ts`** — verify that findings still appear in the Findings tab after an analysis run.
- **`lib/ocr/index.ts`** — upload a multi-page scanned PDF and verify all pages are processed.
- **`lib/auth-server.ts`** — test login, logout, and session expiry manually.
- **Database schema (`lib/db/schema.ts`)** — run `npm run db:generate`, inspect the generated migration, apply with `npm run db:migrate`, and verify the app still loads without errors.

---

## Known Testing Gaps

1. No automated tests exist — any regression requires manual discovery.
2. The OCR pipeline (`lib/ocr/index.ts`) has no test fixtures for known inputs.
3. The AI provider integrations cannot be tested without real API keys.
4. The DOCX export (`lib/export/wordExport.ts`) has no validation that the output is a valid Word document.
5. The FTS5 search table (`pages_fts`) is not created by any migration in the repository — this means FTS search may silently fall back to LIKE queries on a fresh installation.
6. The `/reset-password` route is a UI placeholder; the email-sending flow does not exist.
