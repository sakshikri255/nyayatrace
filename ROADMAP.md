# Roadmap

This document tracks known incomplete features, technical debt, and potential improvements for NyayaTrace. Items are separated into **confirmed gaps** (known from the codebase) and **suggested enhancements** (not confirmed as planned).

> **Important:** Items in this document are not implemented. Do not mark them as implemented unless the corresponding code change has been made and documented in [`CHANGELOG.md`](CHANGELOG.md).

---

## Known Incomplete Features

### 1. Password Reset Flow

**Evidence:** `app/reset-password/page.tsx` exists as a UI page but there is no email-sending logic anywhere in the codebase. Submitting the form does not send a reset email.

**Required work:**
- Implement a password reset token generation endpoint.
- Integrate an email sending service (e.g., Resend, SendGrid, Nodemailer with SMTP).
- Implement a token validation and password update endpoint.
- Link the reset page UI to the actual API endpoints.

---

### 2. Role-Based Access Control

**Evidence:** The `users` table has a `role` column (`advocate`, `clerk`, `admin`) but no API route checks the role before allowing operations.

**Required work:**
- Define which operations require which roles.
- Add role checks in API routes using `getRequiredSession`.
- Reflect permission differences in the UI (e.g., hide delete buttons from clerk role).

---

### 3. API Route Authentication Completeness

**Evidence:** Many API routes do not call `getRequiredSession`. Unauthenticated requests that include a valid cookie bypass the middleware check.

**Required work:**
- Audit all mutation routes (POST, PATCH, DELETE) and add `getRequiredSession` where missing.
- Add session check to the document file-serving route (`GET /api/documents/[id]/file`).

See [`SECURITY.md`](SECURITY.md) for details.

---

### 4. FTS5 Full-Text Search Table

**Evidence:** `app/api/search/route.ts` queries a `pages_fts` SQLite FTS5 virtual table, but this table is not created by any Drizzle migration in the repository.

**Required work:**
- Add a migration that creates the `pages_fts` virtual table.
- Add triggers or a background job to populate and maintain the FTS5 index when pages are added.
- Verify FTS5 search works on a fresh database setup.

---

### 5. Sub-Task 1 from Feature Extraction Fix Plan

**Evidence:** `feature-extraction-fix-plan.md` marks Sub-Task 1 as `[ ] pending`. This sub-task fixes the `generateStoryAndDossier` fallback in `lib/legalSanitizer.ts` to prevent raw OCR text from appearing as `caseStory`.

**Required work:**
- Open `lib/legalSanitizer.ts` and locate `generateStoryAndDossier`.
- Replace the raw-OCR fallback with a `buildFallbackStory` helper that builds from dossier items.
- Cap `storyParts` to a 120-word hard limit.
- Add the raw passage as a dossier entry, not as story content.

---

### 6. Settings Page

**Evidence:** `components/settings/SettingsClient.tsx` and `app/(app)/settings/page.tsx` exist but the extent of what settings are actually persisted is not fully verified.

**Required work:**
- Define what user preferences are supported.
- Implement persistence for any settings that are not yet saved.
- Consider per-user settings vs. global settings.

---

## Technical Debt

### 7. No Automated Test Suite

The project has no unit, integration, or end-to-end tests. See [`TESTING_AND_QUALITY.md`](TESTING_AND_QUALITY.md) for recommendations.

**Suggested additions:**
- Set up Vitest for unit tests.
- Add tests for `calculateStatutoryBail`, `extractSections`, `cleanOcrRegex`, and file upload validation.
- Set up Playwright for end-to-end testing of critical workflows.

---

### 8. `lib/auth.ts` Client-Side Session vs DB Session Consistency

**Evidence:** There are two parallel auth systems: `lib/auth.ts` (client, localStorage) and `lib/auth-server.ts` (server, DB). Signup via `lib/auth.ts` (`signUpUser`) does not call the server API — it only writes to localStorage. If a user signs up through the client-side path, no DB record is created and the session will not survive a page reload.

**Required work:**
- Ensure all sign-up flows go through `POST /api/auth/signup` and not through `lib/auth.ts` directly.
- Consider removing or deprecating the client-only auth path.

---

### 9. Security Headers

No `Content-Security-Policy`, `X-Frame-Options`, or `Strict-Transport-Security` headers are configured.

**Required work:**
- Add a `headers()` function in `next.config.mjs` to set security headers.

---

### 10. Groq Model Name in `.env.example`

**Evidence:** `feature-extraction-fix-plan.md` notes that the Groq model `llama-3.3-70b-versatile` in `.env.local` returns a "model doesn't exist" API error. The `.env.example` should reference a currently valid Groq model.

**Required work:**
- Update the comment in `.env.example` to recommend a currently valid Groq model name (e.g., `llama3-70b-8192`).

---

### 11. `Math.random()` Fallback in Session Token Generation

**Evidence:** `lib/auth-server.ts` `generateToken()` falls back to `Math.random()` if `crypto.randomUUID` is unavailable. `Math.random()` is not cryptographically secure.

**Required work:**
- Replace the fallback with `crypto.randomBytes(16).toString('hex')` (available in all Node.js 18+ environments).

---

## UX and Accessibility Improvements (Suggested)

These are suggested enhancements not confirmed as planned:

- **Keyboard navigation audit:** Verify that all interactive elements are reachable by keyboard.
- **Screen reader support:** Add `aria-label` attributes to icon buttons throughout the UI.
- **Mobile layout:** The current layout is optimized for desktop. The sidebar collapses on mobile, but some complex views (verification workspace, concordance matrix) may not be fully usable on small screens.
- **Loading state for document upload:** The current upload shows a processing status after the fact; consider a real-time progress indicator.
- **Pagination for large case lists:** The cases page currently loads all cases. For large datasets, pagination or virtual scrolling would improve performance.

---

## Performance Improvements (Suggested)

- **OCR concurrency limit:** `MAX_PARALLEL_PAGES = 10` in `lib/ocr/index.ts` is a fixed cap. Consider making this configurable via an environment variable.
- **Analysis result caching:** The analysis GET endpoint currently rebuilds the chronology on every request. Consider caching the chronology in the analysis run result.
- **Database connection pooling:** `better-sqlite3` uses a single synchronous connection. For higher concurrency, consider migrating to an async driver or SQLite WAL mode.

---

## Documentation Improvements

- Add screenshots or a demo video to `README.md`.
- Document the OCR language codes supported by the bundled Tesseract models.
- Add API rate limits to `API_DOCUMENTATION.md` once implemented.
- Create a contributor guide for adding new AI providers.
