# Features

This document inventories every major feature in NyayaTrace (NyayaSetu). Status values: **Implemented**, **Partially Implemented**, **Planned**, or **Unverified**.

For architecture context, see [`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md). For the data model, see [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md).

---

## 1. Authentication

**Status:** Implemented

**Purpose:** Restricts workspace access to authenticated users. Supports multiple user roles.

**User workflow:**
1. User visits any app route.
2. Middleware redirects unauthenticated users to `/login?next=<original-path>`.
3. User enters email and password.
4. Credentials are verified against the `users` table (bcrypt).
5. A session token is created and set as an HttpOnly cookie (`nyayasetu_session`, 7-day expiry).
6. User is redirected to the original path.

**Frontend components:** [`app/login/page.tsx`](app/login/page.tsx), [`app/signup/page.tsx`](app/signup/page.tsx), [`components/layout/AuthGuard.tsx`](components/layout/AuthGuard.tsx)

**Backend:** [`app/api/auth/login/route.ts`](app/api/auth/login/route.ts), [`app/api/auth/signup/route.ts`](app/api/auth/signup/route.ts), [`app/api/auth/logout/route.ts`](app/api/auth/logout/route.ts), [`lib/auth-server.ts`](lib/auth-server.ts)

**Database tables:** `users`, `sessions`

**Roles:** `advocate`, `clerk`, `admin` (stored in DB; UI does not currently enforce role-based permissions beyond display)

**Demo accounts:** Two demo users are seeded automatically on first login. See [`README.md`](README.md) for credentials.

**Limitations:**
- No password reset email flow (the `/reset-password` page exists as a UI placeholder but does not send emails).
- Role-based access control is stored but not enforced in API routes.

---

## 2. Case Management

**Status:** Implemented

**Purpose:** Create, view, edit, and delete legal cases of different types.

**User workflow:**
1. Navigate to Cases (`/cases`).
2. Create a new case with title, case number, type, court, jurisdiction, judge, and advocate.
3. View case detail page with tabs: Overview, Documents/Uploads, Hearings, Orders, Findings, Legal Sections, Analysis, Report.
4. Edit or delete a case from the case detail page.

**Frontend components:** [`components/cases/CasesClient.tsx`](components/cases/CasesClient.tsx), [`components/cases/CaseCard.tsx`](components/cases/CaseCard.tsx), [`components/cases/CaseDetailTabs.tsx`](components/cases/CaseDetailTabs.tsx), [`components/cases/EditCaseDialog.tsx`](components/cases/EditCaseDialog.tsx), [`components/cases/DeleteCaseDialog.tsx`](components/cases/DeleteCaseDialog.tsx)

**Backend:** [`app/api/cases/route.ts`](app/api/cases/route.ts), [`app/api/cases/[id]/route.ts`](app/api/cases/[id]/route.ts)

**Database tables:** `cases`

**Case types:** `criminal`, `civil`, `bail`, `parole`, `unspecified`

**Case statuses:** `active`, `closed`, `pending`, `stayed`, `unspecified`

**Filtering and search:** Cases can be filtered by status and type. Global search covers document page text and findings.

---

## 3. Document Upload and Processing

**Status:** Implemented

**Purpose:** Upload court documents and automatically extract their text content for analysis.

**User workflow:**
1. Open a case detail page and navigate to the Uploads tab.
2. Select a PDF, JPEG, or PNG file (max 20 MB).
3. Optionally specify the OCR language (default: English).
4. The server validates the file (size, extension, magic bytes, duplicate SHA-256 hash).
5. The file is saved to `uploads/<caseId>/<uuid>.<ext>`.
6. Text is extracted: PDF embedded text via PDF.js; scanned pages via Tesseract OCR.
7. Each page is stored in the `pages` table with extracted text and a quality rating.
8. Document status updates to `complete` or `failed`.

**Frontend components:** [`components/cases/tabs/UploadsTab.tsx`](components/cases/tabs/UploadsTab.tsx), [`components/cases/tabs/DocumentsTab.tsx`](components/cases/tabs/DocumentsTab.tsx), [`components/cases/DeleteDocumentDialog.tsx`](components/cases/DeleteDocumentDialog.tsx)

**Backend:** [`app/api/documents/route.ts`](app/api/documents/route.ts), [`app/api/documents/[id]/route.ts`](app/api/documents/[id]/route.ts), [`app/api/documents/[id]/file/route.ts`](app/api/documents/[id]/file/route.ts), [`app/api/documents/[id]/reprocess-page/route.ts`](app/api/documents/[id]/reprocess-page/route.ts)

**Library:** [`lib/ocr/index.ts`](lib/ocr/index.ts)

**Database tables:** `documents`, `pages`

**Supported types:** PDF, JPEG, PNG

**OCR languages:** English (`eng`) by default. Tesseract language models for Hindi, Bengali, Tamil, Telugu, and Gujarati are detected automatically from script ranges.

**Error handling:**
- Duplicate files (same SHA-256 in same case) are rejected with HTTP 409.
- Files exceeding 20 MB are rejected with HTTP 413.
- Unsupported types are rejected with HTTP 415.
- Magic byte mismatch is rejected with HTTP 400.
- Documents with no readable pages are marked `failed` but retained.

---

## 4. Local Case Analysis

**Status:** Implemented

**Purpose:** Extract entities and detect discrepancies from case documents without requiring an AI API key.

**User workflow:**
1. Open a case with processed documents.
2. Navigate to the Analysis tab.
3. Click "Run Analysis" (local mode, no AI key needed).
4. The system builds a synopsis: party names, dates, locations, chronology, and potential inconsistencies.
5. Findings (discrepancies) are stored and linked to source document pages.
6. Previous analysis runs are available for comparison.

**Frontend components:** [`components/cases/tabs/AnalysisWorkspace.tsx`](components/cases/tabs/AnalysisWorkspace.tsx), [`components/ZigZagLegalCard.tsx`](components/ZigZagLegalCard.tsx), [`components/ExecutiveLegalCard.tsx`](components/ExecutiveLegalCard.tsx)

**Backend:** [`app/api/cases/[id]/analysis/route.ts`](app/api/cases/[id]/analysis/route.ts)

**Library:** [`lib/analysis/synopsis.ts`](lib/analysis/synopsis.ts), [`lib/legalSanitizer.ts`](lib/legalSanitizer.ts), [`lib/analysis/chronology.ts`](lib/analysis/chronology.ts), [`lib/analysis/sectionExtractor.ts`](lib/analysis/sectionExtractor.ts)

**Database tables:** `analysis_runs`, `findings`, `finding_sources`

**Finding types:** `date_discrepancy`, `name_variation`, `location_mismatch`, `missing_info`, `note`

**Limitations:**
- Local extraction uses regex patterns. Complex or atypical document layouts may reduce accuracy.
- All locally generated inconsistencies are stored as `needs_review`, never as verified facts.

---

## 5. AI-Assisted Analysis

**Status:** Implemented

**Purpose:** Use a configured LLM to produce a richer, structured case analysis including executive summaries, fact matrices, and verified citations.

**User workflow:**
1. Configure an AI provider API key in `.env.local`.
2. Open the Analysis tab for a case.
3. Select a provider (Gemini, OpenAI, Groq, OpenRouter, or Ollama) from the UI.
4. Optionally select a language for the output.
5. Click "Run AI Analysis". The system sends extracted page text to the selected provider.
6. The AI response is merged with the local synopsis and stored.
7. The analysis run displays the AI executive summary, fact matrix, and verified citations.

**Backend:** [`app/api/cases/[id]/analysis/route.ts`](app/api/cases/[id]/analysis/route.ts)

**Library:** [`lib/analysis/gemini.ts`](lib/analysis/gemini.ts), [`lib/analysis/openai.ts`](lib/analysis/openai.ts), [`lib/analysis/groq.ts`](lib/analysis/groq.ts), [`lib/analysis/openrouter.ts`](lib/analysis/openrouter.ts), [`lib/analysis/ollama.ts`](lib/analysis/ollama.ts)

**AI data sent:** Extracted page text (max ~120,000 characters) with document and page identifiers. No original binary files are sent.

**Limitations:**
- Requires a valid API key for the selected provider.
- AI output quality depends on OCR text quality and the provider's model.
- AI-suggested inconsistencies are stored as `needs_review` and must be human-reviewed.

---

## 6. Legal Sections Analysis

**Status:** Implemented

**Purpose:** Automatically detect IPC and BNS legal section references in uploaded documents and display relevant metadata, concordance links, and landmark judgments.

**User workflow:**
1. Open the Legal Sections tab for a case.
2. Click "Auto-Detect from Case Documents".
3. The server scans all OCR-extracted page text using regex patterns.
4. Detected sections are enriched with offense metadata, bailability, and pre-curated landmark judgments.
5. Users can also manually search and browse sections.
6. Each section links to the Concordance page for the full IPC ↔ BNS mapping.

**Frontend components:** [`components/cases/tabs/LegalSectionsTab.tsx`](components/cases/tabs/LegalSectionsTab.tsx)

**Backend:** [`app/api/cases/[id]/legal-sections/detect/route.ts`](app/api/cases/[id]/legal-sections/detect/route.ts), [`app/api/cases/[id]/legal-sections/extracted/route.ts`](app/api/cases/[id]/legal-sections/extracted/route.ts), [`app/api/legal-sections/route.ts`](app/api/legal-sections/route.ts)

**Library:** [`lib/legal/sections.ts`](lib/legal/sections.ts), [`lib/legal/landmarkJudgments.ts`](lib/legal/landmarkJudgments.ts), [`lib/analysis/sectionExtractor.ts`](lib/analysis/sectionExtractor.ts)

**Supported laws:** IPC (Indian Penal Code), BNS (Bharatiya Nyaya Sanhita), CrPC, BNSS

**Detection source:** `document_text` (from OCR pages) or `case_description` (from case metadata)

**Note on landmark judgments:** The judgment database is a curated static list. Entries include a `verificationNote` field indicating whether the citation has been independently verified. Relevance to a specific case must be assessed by a qualified advocate.

---

## 7. IPC ↔ BNS Concordance

**Status:** Implemented

**Purpose:** Provide a searchable, filterable reference of IPC section ↔ BNS section mappings for the complete criminal code transition.

**User workflow:**
1. Navigate to `/concordance`.
2. Search by section number, offense name, or keyword.
3. Filter by category (offense, procedure, evidence) or bailability.
4. View the corresponding new/old section, offense, punishment, and key elements.

**Frontend components:** [`components/legal/ConcordanceMatrix.tsx`](components/legal/ConcordanceMatrix.tsx)

**Backend:** [`app/api/legal-sections/concordance/route.ts`](app/api/legal-sections/concordance/route.ts)

**Library:** [`lib/legal/sections.ts`](lib/legal/sections.ts)

---

## 8. Hearings Tracking

**Status:** Implemented

**Purpose:** Record and display a timeline of hearing events for each case.

**User workflow:**
1. Open a case and navigate to the Hearings tab.
2. Add a new hearing with date, type, description, outcome, and optional adjournment reason.
3. View the hearing timeline.
4. The dashboard shows a monthly hearing activity chart.

**Frontend components:** [`components/cases/tabs/HearingsTab.tsx`](components/cases/tabs/HearingsTab.tsx), [`components/progress/HearingTimeline.tsx`](components/progress/HearingTimeline.tsx)

**Backend:** [`app/api/hearings/route.ts`](app/api/hearings/route.ts), [`app/api/hearings/[id]/route.ts`](app/api/hearings/[id]/route.ts), [`app/api/hearings/chart/route.ts`](app/api/hearings/chart/route.ts)

**Database tables:** `hearings`

**Event types:** `bail_hearing`, `charge_framing`, `arguments`, `judgment`, `order`, `adjournment`

---

## 9. Bail Briefs and Statutory Bail Calculator

**Status:** Implemented

**Purpose:** Provide a dedicated bail management view per case, including statutory bail deadline calculation (CrPC s.167(2) / BNSS s.187), bail conditions, surety bonds, and parole tracking.

**User workflow:**
1. Navigate to Bail Briefs (`/bail-briefs/<caseId>`).
2. View the statutory bail calculator: days in custody, deadline, progress bar.
3. View and manage bail conditions (surety, reporting, travel, activity).
4. Record condition compliance events (complied / violated).
5. Manage surety bond details.
6. View UTP (Under-Trial Prisoner) relief eligibility.
7. Generate a draft bail application.
8. View parole timeline (for parole cases).

**Frontend components:** [`components/bail/BailBriefView.tsx`](components/bail/BailBriefView.tsx), [`components/bail/StatutoryBailCard.tsx`](components/bail/StatutoryBailCard.tsx), [`components/bail/ConditionsTable.tsx`](components/bail/ConditionsTable.tsx), [`components/bail/SuretyBondPanel.tsx`](components/bail/SuretyBondPanel.tsx), [`components/bail/UTPReliefCard.tsx`](components/bail/UTPReliefCard.tsx), [`components/bail/ParoleTimelineCard.tsx`](components/bail/ParoleTimelineCard.tsx), [`components/bail/DraftApplicationTab.tsx`](components/bail/DraftApplicationTab.tsx)

**Backend:** [`app/api/cases/[id]/bail-brief/route.ts`](app/api/cases/[id]/bail-brief/route.ts), [`app/api/cases/[id]/conditions/[conditionId]/route.ts`](app/api/cases/[id]/conditions/[conditionId]/route.ts), [`app/api/cases/[id]/conditions/[conditionId]/compliance/route.ts`](app/api/cases/[id]/conditions/[conditionId]/compliance/route.ts), [`app/api/cases/[id]/conditions/[conditionId]/surety/route.ts`](app/api/cases/[id]/conditions/[conditionId]/surety/route.ts), [`app/api/cases/[id]/bail-draft/generate/route.ts`](app/api/cases/[id]/bail-draft/generate/route.ts), [`app/api/cases/[id]/utp-relief/route.ts`](app/api/cases/[id]/utp-relief/route.ts)

**Library:** [`lib/analysis/statutoryBail.ts`](lib/analysis/statutoryBail.ts), [`lib/analysis/utpRelief.ts`](lib/analysis/utpRelief.ts)

**Database tables:** `bail_conditions`, `condition_compliance_events`, `surety_bonds`, `bail_drafts`

**Applicable law:** Auto-detected from remand date (BNSS if on/after 2024-07-01; CrPC otherwise) or manually set per case.

---

## 10. Document Verification Workspace

**Status:** Implemented

**Purpose:** Side-by-side document viewer and analysis workspace where advocates can review extracted text, findings, and add annotations.

**User workflow:**
1. Navigate to Verification (`/verification/<caseId>`).
2. The left panel shows a document viewer with the extracted text per page.
3. The right panel shows findings linked to specific pages.
4. Users can add, tag, and color-code text annotations.
5. Users can open the AI case chat drawer to query the case documents.

**Frontend components:** [`components/verification/VerificationWorkspace.tsx`](components/verification/VerificationWorkspace.tsx), [`components/verification/DocumentViewer.tsx`](components/verification/DocumentViewer.tsx), [`components/verification/DocumentPanel.tsx`](components/verification/DocumentPanel.tsx), [`components/verification/FindingsPanel.tsx`](components/verification/FindingsPanel.tsx), [`components/verification/AnnotationsPanel.tsx`](components/verification/AnnotationsPanel.tsx), [`components/verification/CaseChatDrawer.tsx`](components/verification/CaseChatDrawer.tsx), [`components/verification/TemporalTimeline.tsx`](components/verification/TemporalTimeline.tsx)

**Backend:** [`app/api/annotations/route.ts`](app/api/annotations/route.ts), [`app/api/annotations/[id]/route.ts`](app/api/annotations/[id]/route.ts), [`app/api/cases/[id]/chat/route.ts`](app/api/cases/[id]/chat/route.ts), [`app/api/cases/[id]/temporal-analysis/route.ts`](app/api/cases/[id]/temporal-analysis/route.ts)

**Database tables:** `document_annotations`, `case_chats`

**Annotation tags:** `alibi`, `medical`, `panchnama`, `fir_lapse`, `eyewitness`, `procedural_lapse`, `general`

**Annotation colors:** `amber`, `emerald`, `teal`, `rose`, `blue`

---

## 11. Findings Management

**Status:** Implemented

**Purpose:** Track discrepancies detected during analysis; allow advocates to review and resolve them.

**User workflow:**
1. View findings in the Findings tab of a case detail page.
2. Each finding shows type, description, extracted value, comparison value, severity, and source pages.
3. Advocate can mark a finding as Verified, Not a Discrepancy, or leave it as Needs Review.
4. Review history is stored.

**Frontend components:** [`components/cases/tabs/FindingsTab.tsx`](components/cases/tabs/FindingsTab.tsx)

**Backend:** [`app/api/findings/route.ts`](app/api/findings/route.ts), [`app/api/findings/[id]/route.ts`](app/api/findings/[id]/route.ts)

**Database tables:** `findings`, `finding_sources`, `finding_reviews`

---

## 12. Case Reports

**Status:** Implemented

**Purpose:** Generate a structured case brief for printing or DOCX export.

**User workflow:**
1. Navigate to Reports (`/reports/<caseId>`).
2. View the auto-generated case brief including case metadata, findings summary, hearing timeline, orders, and analysis.
3. Print to PDF using the browser print dialog.
4. Download as a formatted DOCX file.

**Frontend components:** [`components/reports/CaseBriefView.tsx`](components/reports/CaseBriefView.tsx)

**Backend:** [`app/api/cases/[id]/brief/route.ts`](app/api/cases/[id]/brief/route.ts)

**Library:** [`lib/export/wordExport.ts`](lib/export/wordExport.ts)

**Export format:** DOCX generated as a Blob from HTML content; downloaded via the browser. No server-side DOCX library is used — the export uses a Word-compatible HTML wrapper.

---

## 13. Dashboard (Overview)

**Status:** Implemented

**Purpose:** Provide a quick view of the current case portfolio and recent activity.

**User workflow:**
1. Navigate to Overview (`/overview`).
2. View KPI cards: total cases, active cases, pending cases, closed cases.
3. View recent cases table.
4. View hearing activity line chart (hearings per month).

**Frontend components:** [`components/dashboard/KPICard.tsx`](components/dashboard/KPICard.tsx), [`components/dashboard/RecentCasesTable.tsx`](components/dashboard/RecentCasesTable.tsx), [`components/dashboard/ActivityLineChart.tsx`](components/dashboard/ActivityLineChart.tsx)

**Backend:** [`app/api/overview/route.ts`](app/api/overview/route.ts), [`app/api/overview/alerts/route.ts`](app/api/overview/alerts/route.ts)

---

## 14. Cause List

**Status:** Implemented

**Purpose:** Display a board-style view of upcoming case hearings.

**Frontend components:** [`components/causelist/CauseListBoard.tsx`](components/causelist/CauseListBoard.tsx)

**Backend:** [`app/api/cause-list/route.ts`](app/api/cause-list/route.ts)

---

## 15. Full-Text Search

**Status:** Implemented

**Purpose:** Search across all case document page text and findings.

**User workflow:**
1. Use the Command Palette (`Ctrl+K` / `⌘K`) or the search bar in the Topbar.
2. Results show matching page text snippets and findings, with case and document context.
3. Search supports FTS5 (SQLite full-text search) when the table is available; falls back to LIKE queries.

**Frontend components:** [`components/layout/CommandPalette.tsx`](components/layout/CommandPalette.tsx)

**Backend:** [`app/api/search/route.ts`](app/api/search/route.ts)

---

## 16. Translation

**Status:** Implemented

**Purpose:** Translate analysis output into regional Indian languages.

**User workflow:** Select a language in the Analysis tab; the AI analysis is generated in that language, or the result can be translated post-generation.

**Backend:** [`app/api/translate/route.ts`](app/api/translate/route.ts), [`app/api/cases/[id]/analysis/translate/route.ts`](app/api/cases/[id]/analysis/translate/route.ts)

**Requires:** Gemini or OpenAI API key.

**Limitations:** Language list is defined in `lib/constants/languages.ts`. Translation accuracy depends on the provider model.

---

## 17. Case Progress View

**Status:** Implemented

**Purpose:** Show a detailed activity and progress timeline per case.

**Frontend components:** [`components/progress/CaseProgressView.tsx`](components/progress/CaseProgressView.tsx), [`components/progress/HearingTimeline.tsx`](components/progress/HearingTimeline.tsx), [`components/progress/MasterChronologyView.tsx`](components/progress/MasterChronologyView.tsx), [`components/progress/CaseActivityChart.tsx`](components/progress/CaseActivityChart.tsx)

---

## 18. References Page

**Status:** Implemented

**Purpose:** Quick-reference listing of judges and advocates.

**Frontend components:** [`components/landing/ReferencesSection.tsx`](components/landing/ReferencesSection.tsx)

**Route:** `app/(app)/references/page.tsx`

---

## 19. Settings

**Status:** Partially Implemented

**Purpose:** User-facing settings (theme, notification preferences, etc.).

**Frontend components:** [`components/settings/SettingsClient.tsx`](components/settings/SettingsClient.tsx)

**Limitations:** Settings page exists but the extent of persisted user preferences is not fully verified. Theme toggle is functional (next-themes).

---

## 20. Progressive Web App (PWA)

**Status:** Implemented (production builds only)

**Purpose:** Allow the app to be installed as a desktop or mobile app and cache key pages for offline access.

**Configuration:** [`next.config.mjs`](next.config.mjs) wraps the Next.js config with `@ducanh2912/next-pwa` in production. Cached routes: `/overview`, `/cases`, `/cause-list`, `/concordance`.

**Limitation:** PWA features (service worker, install prompt) are disabled in `npm run dev` to avoid Turbopack conflicts.

---

## 21. Detective Investigation Wall

**Status:** Implemented (backend route exists)

**Purpose:** A visual "investigation board" for a case.

**Backend:** [`app/api/cases/[id]/detective-wall/route.ts`](app/api/cases/[id]/detective-wall/route.ts)

**Frontend:** [`components/cases/DetectiveInvestigationWall.tsx`](components/cases/DetectiveInvestigationWall.tsx)

**Note:** Full feature scope not fully verified from repository inspection alone.

---

## 22. Judicial Orders Tracking

**Status:** Implemented

**Purpose:** Record judicial orders (bail orders, stay orders, sentence, etc.) for a case.

**Frontend components:** [`components/cases/tabs/OrdersTab.tsx`](components/cases/tabs/OrdersTab.tsx)

**Backend:** [`app/api/cases/[id]/orders/route.ts`](app/api/cases/[id]/orders/route.ts)

**Database tables:** `judicial_orders`
