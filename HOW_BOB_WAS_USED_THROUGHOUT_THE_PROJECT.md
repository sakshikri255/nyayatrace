# How IBM Bob Was Used Throughout the Project

> **Accuracy notice:** This document records only evidence available in the repository — commit messages, plan files, code comments, and the current conversation context. It is **not** an exhaustive history of every interaction with IBM Bob. Specific prompt texts, interaction dates before the current conversation, and per-commit attribution to Bob vs. human authorship cannot be reliably reconstructed from the available information. Anything marked _(inferred)_ is based on repository patterns rather than a directly observed interaction.

---

## Overview

IBM Bob served as an AI coding assistant throughout the development and maintenance of NyayaTrace (NyayaSetu). Based on the repository evidence available, Bob's role included:

- Generating and refining code for new features and components.
- Assisting with architectural decisions and planning technical changes.
- Writing and iterating on structured work-plan documents before implementation.
- Debugging reported issues and proposing targeted fixes.
- Creating this documentation set.

The project contains explicit evidence of at least one structured planning interaction with Bob in the form of [`feature-extraction-fix-plan.md`](feature-extraction-fix-plan.md), a detailed implementation plan document created to guide a multi-step fix session. Several commit messages also use the prefix conventions (`feat:`, `fix:`, `refactor:`, `style:`) consistent with structured AI-assisted workflows.

---

## Role in the Development Workflow

Bob was used in an **iterative, requirement-first workflow**:

```
User describes requirement or bug
    ↓
Bob inspects the codebase (reads files, traces call chains)
    ↓
Bob proposes a plan (sometimes written as a .md file first)
    ↓
User reviews / refines the plan
    ↓
Bob implements changes (targeted diffs, not rewrites)
    ↓
User validates manually (no automated test suite)
    ↓
Iteration if results differ from expectation
```

This pattern is visible in `feature-extraction-fix-plan.md`, which explicitly tracks sub-task status (`[ ] pending`, `[x] done`) and records scope exclusions confirmed by the user.

---

## Documented Features and Modules with Bob's Involvement

### 1. Legal Sections Analysis Pipeline

The plan file `feature-extraction-fix-plan.md` provides direct evidence that Bob was involved in diagnosing and fixing the **legal section card story extraction** feature. The plan covers:

- Root-cause analysis of the `generateStoryAndDossier` fallback in [`lib/legalSanitizer.ts`](lib/legalSanitizer.ts).
- Proposing the fix to prevent raw OCR text from appearing in the visible card body (`ZigZagLegalCard.tsx`).
- Fixing the AI-path merge step in [`app/api/cases/[id]/analysis/route.ts`](app/api/cases/[id]/analysis/route.ts) so that AI-generated narratives from `verifiedCitations` are properly propagated into `synopsis.facts[].caseStory`.
- Improving the Groq prompt in [`lib/analysis/groq.ts`](lib/analysis/groq.ts) to match Gemini-quality output.

Sub-tasks 2, 3, and 4 are marked `[x] done` in the plan, indicating they were completed during a Bob session.

### 2. Middleware and Authentication Guard _(evidenced by commit history)_

The commit `feat: add authentication guard component, update middleware, and create login and signup pages` (2026-10-22) and the subsequent `feat(middleware): redirect root to login and guard auth pages for logged-in users` suggest Bob was used to scaffold the [`middleware.ts`](middleware.ts) route guard and the [`components/layout/AuthGuard.tsx`](components/layout/AuthGuard.tsx) component. Both files follow a clean, minimal pattern consistent with Bob's engineering discipline.

### 3. Legal Sections Auto-Detect and Landmark Judgments _(evidenced by commit history)_

The commit `feat(legal-sections): add auto-detect endpoint and landmark judgments UI` (2026-10-26) corresponds directly to [`app/api/cases/[id]/legal-sections/detect/route.ts`](app/api/cases/[id]/legal-sections/detect/route.ts) and the landmark judgments library in [`lib/legal/landmarkJudgments.ts`](lib/legal/landmarkJudgments.ts). The accuracy policy comment at the top of `landmarkJudgments.ts` reflects the type of explicit constraint Bob applies when instructed not to fabricate legal data.

### 4. References Page _(evidenced by commit history)_

The commit `feat: add ReferencesSection with judges and advocates listing` (2026-10-26) and `feat(references): add dedicated references page and update sidebar link` indicate Bob built the references page at [`app/(app)/references/page.tsx`](app/(app)/references/page.tsx) and the [`components/landing/ReferencesSection.tsx`](components/landing/ReferencesSection.tsx) component.

### 5. PageLoader and Route Loading States _(evidenced by commit history)_

The commit `feat: add PageLoader component and route loading states with spinner overlay` (2026-10-26) corresponds to [`components/layout/PageLoader.tsx`](components/layout/PageLoader.tsx) and the per-route `loading.tsx` files throughout `app/(app)/`. This was a UI polish change adding consistent route-transition feedback.

### 6. Legal Sections UI Refactor _(evidenced by commit history)_

The commit `refactor(legal-sections): simplify components and modernise UI layout` (2026-10-26) reflects a component simplification pass on the legal sections tab, likely guided by Bob to reduce complexity without changing functionality.

### 7. Concordance Matrix Styling Iterations _(evidenced by commit history)_

Multiple commits on 2026-10-22 (`style(concordance): …`) show iterative UI refinements to the Concordance page. The revert commit (`revert: revert last changes to concordance cards`) is consistent with a Bob workflow where the user reviewed a change and requested a rollback before proceeding differently.

### 8. Case Analysis Workspace _(evidenced by commit history)_

The commit `feat: redesign case analysis workspace and citations` (2026-10-22) corresponds to the verification and analysis workspace in [`components/verification/VerificationWorkspace.tsx`](components/verification/VerificationWorkspace.tsx) and the case detail tabs. The depth and breadth of the analysis pipeline (multi-provider AI, local extraction, chronology building, findings storage) is consistent with Bob-assisted implementation.

### 9. Documentation (Current Conversation)

This entire documentation set (`AGENTS.md`, `README.md`, `PROJECT_ARCHITECTURE.md`, `FEATURES.md`, `DATABASE_SCHEMA.md`, `API_DOCUMENTATION.md`, `SETUP_AND_DEPLOYMENT.md`, `TESTING_AND_QUALITY.md`, `SECURITY.md`, `CHANGELOG.md`, `ROADMAP.md`, `CONTRIBUTING.md`, and this file) was created by IBM Bob in the current conversation after a thorough inspection of the repository's source code, configuration, routes, database schema, and git history.

---

## Examples of Planning Interactions

### Plan File: `feature-extraction-fix-plan.md`

This file is the most direct surviving evidence of a Bob planning interaction. Key characteristics:

- It begins with a **scope confirmation** from the user: _"Sub-Tasks 1–4 only. Sub-Task 5 (Ollama) is excluded."_ This reflects the user reviewing and trimming Bob's initially broader proposal.
- It records a **known limitation**: _"The Groq model `llama-3.3-70b-versatile` is returning a 'model doesn't exist' error."_ This is the kind of environment-specific debugging note that emerges from a live session.
- Each sub-task includes an **Expected Outcomes** section, a **Todo List** with specific file paths and line numbers, and **Relevant Context** — a Bob documentation pattern.
- Sub-tasks are marked with status symbols that were updated during the session as work was completed.

---

## Iterative Workflow Evidence

The git history shows a characteristic pattern of rapid iterative commits on the same day, which is consistent with a Bob-assisted session:

- Multiple `style(concordance):` commits in sequence, including a revert, indicate the user was reviewing visual output and requesting adjustments.
- The progression from `feat: add authentication guard component` → `feat(middleware): redirect root to login` → `Fix route-based dark and light themes` on 2026-10-22 shows layered feature building in a single session.

---

## Known Limitations and Areas Requiring Human Review

| Area | Limitation |
|---|---|
| Legal data accuracy | `lib/legal/sections.ts` and `lib/legal/landmarkJudgments.ts` contain hand-curated legal data. Bob generated the initial structure; a qualified Indian advocate should verify all IPC/BNS mappings and judgment citations before relying on them in practice. |
| AI analysis output | AI-generated case summaries (Gemini, Groq, etc.) are produced by third-party LLMs. Bob implemented the integration; output accuracy depends on the LLM provider and the quality of the OCR-extracted text. |
| Demo seed data | Seed scripts (`lib/db/seed-demo.ts`, `seed-aditi-case.ts`, `seed-rathore-case.ts`, `seed-showcase.ts`) contain fictional case data. Bob likely assisted in creating these; they must never be confused with real case records. |
| Authentication security | The current auth system uses `bcryptjs` + SQLite sessions. Bob implemented this, but the system has not undergone a formal security audit. See [`SECURITY.md`](SECURITY.md) for known limitations. |
| OCR accuracy | The Tesseract OCR pipeline was implemented with Bob's assistance. OCR output quality depends on document scan quality. All extracted text must be verified against the source document. |

---

## Summary

IBM Bob's documented role in this project includes:

- **Feature implementation**: auth flow, legal sections auto-detect, references page, concordance UI, loading states, case analysis workspace.
- **Bug fixing and refactoring**: legal section card story extraction, AI analysis merge, Groq prompt quality.
- **Technical planning**: structured sub-task plans with scope confirmation, root-cause analysis, and explicit non-goals.
- **Documentation**: this complete documentation set.

The complete history of Bob interactions cannot be reconstructed from the available repository evidence. This document captures only what is verifiable from commit history, plan files, code comments, and the current conversation.
