# Changelog

All notable changes to NyayaTrace are documented here. This format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> **Historical accuracy note:** The complete development history predates the creation of this CHANGELOG. The entries below are reconstructed from available Git history (`git log --format="%ad %s"`) and are grouped by approximate time period. Precise version numbers and dates cannot be verified from the available repository evidence; dates are taken directly from commit metadata. If commit timestamps are inaccurate, the relative ordering of changes is still correct.

---

## [Unreleased]

*(Changes committed after this documentation baseline was established go here.)*

---

## [Initial Documentation Baseline] — 2026-10-26

This entry marks the creation of the comprehensive documentation set by IBM Bob.

### Added
- `AGENTS.md` — Instructions for AI coding agents
- `README.md` — Replaced minimal placeholder with full project README
- `PROJECT_ARCHITECTURE.md` — Architecture diagrams and component responsibilities
- `FEATURES.md` — Full feature inventory with implementation status
- `DATABASE_SCHEMA.md` — Complete table reference with ER diagram
- `API_DOCUMENTATION.md` — All API routes with request/response formats
- `SETUP_AND_DEPLOYMENT.md` — Setup, environment variables, troubleshooting
- `TESTING_AND_QUALITY.md` — Manual testing checklists and test recommendations
- `SECURITY.md` — Security practices and known limitations
- `CHANGELOG.md` — This file
- `ROADMAP.md` — Future improvements and technical debt
- `CONTRIBUTING.md` — Development workflow and contribution guidelines
- `HOW_BOB_WAS_USED_THROUGHOUT_THE_PROJECT.md` — IBM Bob usage history

---

## [Development Period] — 2026-10-22 to 2026-10-26

The following changes are reconstructed from Git commit history.

### Added (2026-10-26)
- `PageLoader` component and per-route loading states with spinner overlay
- Dedicated `/references` page with judges and advocates listing
- `ReferencesSection` landing page component
- Auto-detect endpoint for legal sections from case documents (`POST /api/cases/[id]/legal-sections/detect`)
- Landmark judgments UI in the Legal Sections tab

### Changed (2026-10-26)
- Refactored legal sections tab: simplified components and modernised UI layout

### Added (2026-10-22 to 2026-10-23)
- Authentication guard component (`components/layout/AuthGuard.tsx`)
- Login and signup pages (`app/login/`, `app/signup/`)
- Middleware route guard: redirect root to `/login`, protect all app routes
- Server-side session management with bcryptjs and SQLite sessions table
- Core layout components: Sidebar, Topbar, NavigationProgressBar, RouteThemeController
- Landing page "Our Process" section
- Case analysis workspace redesign with citations
- AI-generated verified citations merge into synopsis facts
- Groq prompt quality improvements matching Gemini standard
- OCR model loading from local `tessdata/` directory (previously loaded remotely)
- Legal section detection with regex-based `sectionExtractor`
- Report section and dashboard overview
- Global CSS styles and dark mode theme configuration
- Advocate-only workspace and reactive persona switching without page reload

### Changed (2026-10-22 to 2026-10-23)
- Profile menu moved from Topbar to Sidebar top
- Route-based dark/light theme enforcement and layout normalization
- Concordance cards: multiple iterative UI improvements (glassmorphic cards, dual-code badges, table view, category accents)
- Sidebar avatar synced from `localStorage` when session `avatarId` is absent
- Sidebar border opacity increased from 10 to 20

### Removed (2026-10-22)
- Case Brief tab removed from case detail view

### Fixed (2026-10-22)
- OCR model loading from local tessdata (previously attempted remote load and failed offline)
- Gradient heading descender clipping (letters like `g` were cut off)
- Login page: removed incorrect "secure local sandbox" and "local SQLite" labels

### Reverted (2026-10-22)
- Concordance card styling was reverted once and redesigned with a different approach

---

## [Earlier Development] — before 2026-10-22

The following features are present in the codebase but predate the recoverable commit history used here. Their exact introduction dates are not verifiable.

### Features known to exist from repository inspection

- SQLite database with Drizzle ORM (16 tables: cases, documents, pages, analysis_runs, findings, finding_sources, finding_reviews, hearings, judicial_orders, bail_conditions, condition_compliance_events, surety_bonds, audit_events, document_annotations, users, sessions, bail_drafts, case_chats)
- PDF text extraction via PDF.js with parallel page processing (up to 10 pages concurrently)
- Tesseract OCR for scanned PDFs and images
- Multi-provider AI analysis: Gemini, OpenAI, Groq, OpenRouter, Ollama
- Local regex-based case analysis with discrepancy detection
- Bail brief view with statutory bail deadline calculator (CrPC/BNSS auto-detection)
- Bail conditions, compliance events, and surety bonds
- IPC ↔ BNS concordance matrix
- Hearing timeline and cause list board
- Document verification workspace with annotations
- AI case chat (Gemini)
- Analysis translation to regional languages
- DOCX export for case reports
- Full-text search with FTS5 + LIKE fallback
- Dashboard with KPI cards and hearing activity chart
- Progressive Web App (production only)
- Multiple seed scripts for demo and showcase data
- `feature-extraction-fix-plan.md` document (evidence of iterative development with IBM Bob)
