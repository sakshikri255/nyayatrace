# Bail & Parole Section — Features & UI/UX Plan

## Overview

This plan covers 9 new features and 5 UI/UX updates for the **Bail & Parole** section (`/bail-briefs`) of NyayaTrace.
Work is scoped to the existing Next.js 14 App Router + Drizzle ORM + SQLite + Tailwind CSS + shadcn/ui stack.
All sub-tasks are designed to be implemented independently and in sequence.

**Key files in scope:**
- `app/(app)/bail-briefs/page.tsx` — list view
- `app/(app)/bail-briefs/[caseId]/page.tsx` — detail page
- `components/bail/BailBriefView.tsx` — main tabbed brief component
- `components/bail/StatutoryBailCard.tsx` — bail tracker card
- `components/bail/ConditionsTable.tsx` — conditions display
- `lib/db/schema.ts` — Drizzle table definitions
- `lib/queries/cases.ts` — data fetching
- `lib/analysis/statutoryBail.ts` — bail calculation engine
- `app/api/cases/[id]/route.ts` — PATCH/GET/DELETE case handler

---

## Sub-Task 1 — Parole Supervision Timeline

**Status:** [ ] pending

### Intent
Parole cases (`caseType: 'parole'`) currently share the same `StatutoryBailCard` as bail cases, but parole tracking needs differ fundamentally. A parole supervision timeline shows key parole milestones: grant date, supervision start/end, reporting schedule, and expiry — not a custody-deadline countdown.

### Expected Outcomes
- A new `ParoleTimelineCard` component renders inside `BailBriefView` for parole cases.
- The card shows: Parole Grant Date, Supervision Start, Supervision End, Reporting Frequency, and Days Until Expiry.
- For non-parole cases the card is never shown; `StatutoryBailCard` only renders for bail/criminal cases.
- New DB columns added to `cases` table for parole-specific fields.
- A new DB migration file is added.

### Todo List
1. Add columns to `cases` table in `lib/db/schema.ts`:
   - `paroleGrantDate: text('parole_grant_date')`
   - `paroleEndDate: text('parole_end_date')`
   - `paroleReportingFrequency: text('parole_reporting_frequency', { enum: ['weekly', 'fortnightly', 'monthly'] })`
2. Create migration file `drizzle/0006_add_parole_fields.sql` with the `ALTER TABLE` statements.
3. Add `paroleGrantDate`, `paroleEndDate`, `paroleReportingFrequency` to `CaseDetail` and `CaseWithCounts` types in `lib/queries/cases.ts`.
4. Create `components/bail/ParoleTimelineCard.tsx`:
   - Full mode: grant date, supervision period bar, reporting frequency badge, days-until-expiry countdown.
   - Compact mode (for list cards): single-line "Supervision ends in X days" with violet styling.
   - Edit dialog: date pickers for grant/end date, reporting frequency toggle buttons.
   - PATCH `/api/cases/[caseId]` on save (reuse existing pattern from `StatutoryBailCard`).
5. Add `paroleGrantDate`, `paroleEndDate`, `paroleReportingFrequency` to the `allowed` fields list in `app/api/cases/[id]/route.ts`.
6. In `BailBriefView.tsx` (Overview tab), show `ParoleTimelineCard` when `caseRecord.caseType === 'parole'`, and `StatutoryBailCard` otherwise.
7. In `bail-briefs/page.tsx` list cards, show `ParoleTimelineCard compact` for parole cases instead of `StatutoryBailCard compact`.
8. Style parole cards with violet palette (`border-violet-200`, `bg-violet-50`, etc.) to visually differentiate from teal bail cards.

### Relevant Context
- `StatutoryBailCard` in `components/bail/StatutoryBailCard.tsx` is the reference pattern for the card + dialog + PATCH flow.
- Drizzle ORM is code-first; schema + migration must both be updated.
- `parole` caseType already exists in the schema enum.
- Parole list cards currently use `border-teal-200` (same as bail) — this should change to `border-violet-200` when `caseType === 'parole'` (also fixes UI/UX update A).

---

## Sub-Task 2 — Bail Condition Compliance Tracker

**Status:** [ ] pending

### Intent
Bail conditions currently only have a static status (`active / revoked / completed`). This feature adds a per-condition compliance log so lawyers can record whether the accused complied on specific dates.

### Expected Outcomes
- A new `condition_compliance_events` table is added to the DB.
- In the `ConditionsTable`, each row has an expandable compliance log section with "Mark Complied / Mark Violated" actions.
- Compliance entries show: date, event type (complied / violated), and an optional note.
- The condition's overall status updates automatically when a violation is recorded (status → `revoked`).

### Todo List
1. Add `conditionComplianceEvents` table to `lib/db/schema.ts`:
   ```
   id, conditionId (FK → bail_conditions.id CASCADE), eventDate (text), eventType ('complied' | 'violated'), note (text nullable), createdAt
   ```
2. Create migration `drizzle/0007_add_condition_compliance_events.sql`.
3. Create API route `app/api/cases/[id]/conditions/[conditionId]/compliance/route.ts`:
   - `GET` — return all compliance events for a condition.
   - `POST` — insert a new compliance event; if `eventType === 'violated'`, also update `bail_conditions.status = 'revoked'`.
4. Update `ConditionsTable` to accept `conditionId` clicks that expand an inline panel showing compliance history + "Add Event" form.
   - The inline panel uses an accordion-style expand (Framer Motion `AnimatePresence`).
   - Event form: date picker, type toggle (complied / violated), optional note textarea.
   - Compliance events listed chronologically with color-coded badges (emerald = complied, rose = violated).
5. Pass a `caseId` prop into `ConditionsTable` so it can call the compliance API.
6. Update `BailBriefView.tsx` to pass `caseId` to `ConditionsTable`.

### Relevant Context
- `ConditionsTable` is at `components/bail/ConditionsTable.tsx` (113 lines).
- Existing badge/pill patterns in the file should be reused for compliance event type badges.
- The `StatutoryBailCard` PATCH+toast flow is the reference pattern for optimistic UI + API calls.

---

## Sub-Task 3 — Surety Bond Manager

**Status:** [ ] pending

### Intent
Surety conditions are stored as plain text today (`conditionType: 'surety'`). This feature adds structured surety bond details: surety name, relationship to accused, bond amount, document reference, and verification status.

### Expected Outcomes
- A new `surety_bonds` table stores structured surety data linked to a bail condition.
- A new "Surety Bonds" sub-section appears within the Conditions tab when surety-type conditions exist.
- Each surety condition shows a "View / Edit Bond Details" expand panel with the structured fields.
- Bond details can be added or edited inline without a separate page.

### Todo List
1. Add `suretyBonds` table to `lib/db/schema.ts`:
   ```
   id, conditionId (FK → bail_conditions.id CASCADE), suretyName (text), relationship (text), bondAmount (text), documentReference (text nullable), verificationStatus ('pending' | 'verified' | 'rejected'), createdAt, updatedAt
   ```
2. Create migration `drizzle/0008_add_surety_bonds.sql`.
3. Create API route `app/api/cases/[id]/conditions/[conditionId]/surety/route.ts`:
   - `GET` — return surety bond for condition (if any).
   - `POST` — create or update (upsert) surety bond record.
4. Create `components/bail/SuretyBondPanel.tsx`:
   - Shows inside a collapsible panel for rows with `conditionType === 'surety'` in `ConditionsTable`.
   - Fields: surety name, relationship, bond amount (text input, e.g. "₹50,000"), document reference, verification status toggle.
   - Save/update via the new surety API endpoint.
5. Import and render `SuretyBondPanel` inside `ConditionsTable` for surety-type rows.
6. Extend the query in `getBailBriefData` (`lib/queries/cases.ts`) to left-join `surety_bonds` into each condition row when `conditionType = 'surety'`.

### Relevant Context
- `bail_conditions.conditionType` enum already has `'surety'`.
- `ConditionsTable` at `components/bail/ConditionsTable.tsx` is where the panel renders.
- Bond amount is stored as text to avoid currency/formatting assumptions (e.g., "₹50,000" or "Rs. 1 Lakh").

---

## Sub-Task 4 — Hearing Countdown Widget

**Status:** [ ] pending

### Intent
Surface the next upcoming hearing prominently on both the brief detail page and the list cards, so a lawyer immediately sees how many days until the next court date without scrolling to the Hearing History tab.

### Expected Outcomes
- On the detail page (Overview tab): a "Next Hearing" card shows hearing date, days remaining, hearing type, and court/judge.
- On the list page: each case card shows a small "Next hearing in X days" badge below the existing `StatutoryBailCard`.
- If no future hearing exists, the widget shows "No upcoming hearing scheduled" with a link to add one.

### Todo List
1. Add a `getNextHearing(caseId: number)` utility function in `lib/queries/cases.ts` (or a new `lib/queries/hearings.ts` if one doesn't already exist) that queries `hearings` where `hearingDate >= today` ordered by date ascending, limit 1.
2. Create `components/bail/NextHearingWidget.tsx`:
   - **Full mode** (detail page): card with `CalendarIcon`, hearing date formatted as "15 July 2025", event type badge, court/judge line, bold "X days away" countdown. Color: amber if ≤ 7 days, teal otherwise.
   - **Compact mode** (list cards): a single-line badge "📅 Next hearing in X days" or "No upcoming hearing".
3. Add the widget to the Overview tab in `BailBriefView.tsx`, in the "Key Dates" section alongside First Hearing and Latest Order.
4. Add compact `NextHearingWidget` to each case card in `bail-briefs/page.tsx` below the `StatutoryBailCard`.
5. Update `getBailBriefData` in `lib/queries/cases.ts` to include `nextHearing` (the result of `getNextHearing`) in the returned object, and update the `BailBriefData` interface.
6. For the list cards, `getAllCases` needs to optionally include a `nextHearingDate` field — add a subquery or post-process in the page component.

### Relevant Context
- `hearings` table has `hearingDate`, `eventType`, `court`, `judge` — all needed fields already exist.
- `BailBriefData` interface is in `lib/queries/cases.ts` at line 200.
- The `StatutoryBailCard` compact display in `bail-briefs/page.tsx` is the visual reference for the compact badge style.

---

## Sub-Task 5 — One-Click Print-Ready PDF Brief

**Status:** [ ] pending

### Intent
Provide a single "Export Brief" button on the detail page that triggers a formatted, print-optimized layout covering: disclaimer, case header, statutory bail status, judicial orders, conditions, and hearing history. CSS print media styles already exist in `app/globals.css`; this feature completes them.

### Expected Outcomes
- A "Print / Export PDF" button appears in the header card of `BailBriefView`.
- Clicking it adds a `print-mode` class to the brief wrapper, which switches all tabs' content to be visible simultaneously in a vertically stacked print layout.
- Browser print dialog opens automatically via `window.print()`.
- The print layout hides: sidebar, topbar, tab triggers, edit/configure buttons, back navigation.
- Each section prints with a clear section heading and page-break hints.

### Todo List
1. In `BailBriefView.tsx`, add a `printMode` state (`useState(false)`).
2. Add a `PrinterIcon` button to the header card row (next to case number + badges).
3. When `printMode === true`:
   - Wrap all tab content sections in a single `<div className="print-brief-layout">` that shows all sections stacked vertically regardless of active tab.
   - Call `window.print()` inside a `useEffect` triggered when `printMode` becomes true, then reset `printMode` to false in the `afterprint` event listener.
4. Add/extend CSS in `app/globals.css` under `@media print`:
   - Hide `.no-print` elements (sidebar, topbar, back-nav, tab triggers, buttons).
   - Show `.print-brief-layout` with stacked section layout.
   - Add `page-break-before: always` between major sections.
   - Set font size and color for print legibility (`font-size: 11pt`, `color: #000`).
5. Add section headings (h3) to each tab content block in the print layout: "Judicial Orders", "Bail / Parole Conditions", "Hearing History", "Document Findings".
6. Apply `no-print` class to: tab trigger list, "Configure Remand" button, "Export Brief" button itself, BailDisclaimer close button (none exists — confirm no change needed).

### Relevant Context
- `app/globals.css` already has `.no-print { display: none !important; }` and `.analysis-print` CSS; this task extends those.
- `BailBriefView.tsx` uses `AnimatePresence` / `motion.div` for tabs — in print mode, bypass animation and show all sections.
- `window.print()` is browser-native; no additional library needed.

---

## Sub-Task 6 — Bail Application Draft Template

**Status:** [ ] pending

### Intent
Add a "Draft Application" tab inside `BailBriefView` that pre-fills a structured bail application text template using existing case data (accused name from title, case number, court, judge, remand date, statutory period, chargesheet status). The output is selectable/copyable rich text the lawyer can paste into their document.

### Expected Outcomes
- A new "Draft Application" tab appears in the `BailBriefView` tab list.
- The tab renders a pre-filled bail application template in a styled `<pre>` / formatted card.
- User can click "Copy to Clipboard" to copy the full draft text.
- If AI keys are configured (Gemini or OpenAI in `.env.local`), a secondary "Enhance with AI" button calls an API route to refine the draft.
- The draft updates live when the user edits the editable fields (accused name, sections cited, etc.).

### Todo List
1. Add `'draft'` to the `TabId` union type in `BailBriefView.tsx`.
2. Add a `TabsTrigger value="draft"` tab button labeled "Draft Application" with a `FileEditIcon`.
3. Create `components/bail/DraftApplicationTab.tsx`:
   - Accepts `data: BailBriefData` as prop.
   - Generates a template string from case fields: court, case number, accused (derived from `caseRecord.title`), remand date, statutory period, chargesheet status, orders count.
   - Displays template in a white card with monospace-style formatting.
   - Editable fields: accused name (pre-filled from title), FIR details (blank), sections (blank), prayer (standard text).
   - "Copy to Clipboard" button using `navigator.clipboard.writeText()`.
4. Create API route `app/api/cases/[id]/draft/route.ts`:
   - `POST` — accepts `{ template: string }`, calls Gemini or OpenAI (whichever key is configured in `process.env`), returns `{ enhanced: string }`.
   - If no AI key is found, return `{ error: 'AI not configured', status: 400 }`.
5. In `DraftApplicationTab`, add "Enhance with AI" button that calls the draft API and replaces the template with the enhanced version. Shows loading state.
6. Add `TabsContent value="draft"` in `BailBriefView.tsx` rendering `<DraftApplicationTab data={data} />`.

### Relevant Context
- AI key handling pattern should follow whatever is established in `lib/` (check for existing AI utility functions before writing new ones).
- The `BailBriefData` type in `lib/queries/cases.ts` already has all fields needed for template generation.
- The draft tab should be visually distinct with a soft blue/slate background to indicate it's a working document, not a finalized record.

---

## Sub-Task 7 — Bail/Parole Audit Log

**Status:** [ ] pending

### Intent
Add a read-only "Changelog" tab to `BailBriefView` that shows every change made to bail-relevant case fields. This provides traceability required in legal practice. The existing `audit_events` table in the schema already exists but is not used for bail field changes.

### Expected Outcomes
- Every PATCH to `/api/cases/[id]` that changes a bail field (`remandDate`, `statutoryPeriodDays`, `chargesheetFiled`, `chargesheetDate`, `paroleGrantDate`, `paroleEndDate`) inserts a row into `audit_events`.
- A new "Changelog" tab in `BailBriefView` displays these events in reverse-chronological order.
- Each row shows: timestamp, field changed, old value, new value.

### Todo List
1. In `app/api/cases/[id]/route.ts` PATCH handler, after a successful `.update()`:
   - Fetch the pre-update case record (before the update query runs).
   - Compare old vs new values for the bail-relevant fields.
   - For each changed field, insert a row into `audit_events` with `eventType = 'bail_field_changed'`, `description = JSON.stringify({ field, oldValue, newValue })`, `caseId`.
2. Add `'changelog'` to the `TabId` union type in `BailBriefView.tsx`.
3. Add `TabsTrigger value="changelog"` tab button labeled "Changelog" with a `HistoryIcon`.
4. Create `components/bail/ChangelogTab.tsx`:
   - Accepts `caseId: number`.
   - Fetches `GET /api/cases/[id]/changelog` on mount.
   - Renders events in a reverse-chronological list with: timestamp (formatted), field name (human-readable label), old value → new value.
   - Empty state: "No changes recorded yet."
5. Create API route `app/api/cases/[id]/changelog/route.ts`:
   - `GET` — query `audit_events` where `caseId = id` AND `eventType = 'bail_field_changed'`, ordered by `performedAt DESC`.
   - Return parsed `description` JSON alongside timestamp.
6. Add `TabsContent value="changelog"` in `BailBriefView.tsx` rendering `<ChangelogTab caseId={caseRecord.id} />`.

### Relevant Context
- `audit_events` table already exists in `lib/db/schema.ts` (lines 293–308) with `caseId`, `eventType`, `description`, `performedBy`, `performedAt`.
- The PATCH handler in `app/api/cases/[id]/route.ts` is where audit inserts should happen.
- Human-readable field labels: `remandDate` → "Remand Date", `statutoryPeriodDays` → "Statutory Period", `chargesheetFiled` → "Chargesheet Filed", `chargesheetDate` → "Chargesheet Date".

---

## Sub-Task 8 — Smart Statutory Section Switcher (CrPC ↔ BNSS)

**Status:** [ ] pending

### Intent
Currently `statutorySection` is hardcoded to `"Sec 167(2) CrPC / Sec 187 BNSS"` in `lib/analysis/statutoryBail.ts`. Cases registered before 1 July 2024 fall under CrPC; cases after fall under BNSS. Add a per-case `applicableLaw` field so the correct section is displayed and the legal ground text is accurate.

### Expected Outcomes
- A new `applicableLaw: 'crpc' | 'bnss' | 'auto'` column on `cases` table.
- `calculateStatutoryBail` reads `applicableLaw` and outputs the correct section: "Sec 167(2) CrPC" or "Sec 187 BNSS".
- The `StatutoryBailCard` dialog has a new "Applicable Law" toggle: CrPC / BNSS / Auto (auto = infer from case creation date).
- A tooltip explains: "BNSS applies to cases registered on or after 1 July 2024."

### Todo List
1. Add `applicableLaw` column to `cases` table in `lib/db/schema.ts`:
   ```typescript
   applicableLaw: text('applicable_law', { enum: ['crpc', 'bnss', 'auto'] }).default('auto')
   ```
2. Create migration `drizzle/0009_add_applicable_law.sql` with the `ALTER TABLE` statement.
3. Add `applicableLaw` to `CaseDetail` and `CaseWithCounts` types in `lib/queries/cases.ts`.
4. Add `applicableLaw` to the `allowed` fields list in the PATCH handler in `app/api/cases/[id]/route.ts`.
5. Update `calculateStatutoryBail` in `lib/analysis/statutoryBail.ts`:
   - Accept `applicableLaw?: 'crpc' | 'bnss' | 'auto'` in the input object.
   - Derive the effective law: if `'auto'`, check `remandDate` — before 2024-07-01 → `'crpc'`, on/after → `'bnss'`.
   - Set `statutorySection` to `"Sec 167(2) CrPC"` or `"Sec 187 BNSS"` (not both).
   - Adjust `legalGround` text to reference the correct law.
6. In `StatutoryBailCard.tsx` dialog, add a three-button toggle for "CrPC / BNSS / Auto" below the statutory period selection. Save via PATCH.
7. Pass `applicableLaw` from `caseData` into `StatutoryBailCard` props and into `calculateStatutoryBail`.

### Relevant Context
- `calculateStatutoryBail` signature is in `lib/analysis/statutoryBail.ts` (line 18+).
- The dialog UI pattern for the 60/90 day toggle (lines 280–303 of `StatutoryBailCard.tsx`) is the reference for the new CrPC/BNSS/Auto toggle.
- BNSS cutoff date: 1 July 2024 (`2024-07-01`).

---

## Sub-Task 9 — Risk Flag Panel

**Status:** [ ] pending

### Intent
Aggregate all critical warnings for a case into a single "Risk Flags" panel displayed at the top of the brief detail page (between the disclaimer and the header card). This prevents lawyers from missing urgent items buried across multiple tabs.

### Expected Outcomes
- A `RiskFlagPanel` component appears at the top of `BailBriefView` when one or more flags are present.
- If no flags exist, the panel is not rendered (zero visual overhead for clean cases).
- Flags include:
  1. **Statutory bail accrued** — bail right triggered, no chargesheet filed (rose / critical).
  2. **Bail deadline urgent** — ≤ 10 days remaining (amber / warning).
  3. **Conditions without compliance record** — any active condition with no compliance events (amber).
  4. **Hearings with no outcome recorded** — past hearings with `outcome = null` (slate / info).
  5. **Unreviewed document findings** — findings with `reviewStatus = 'needs_review'` (amber).
- Each flag is a clickable chip that scrolls to / activates the relevant tab.

### Todo List
1. Create `components/bail/RiskFlagPanel.tsx`:
   - Accepts props: `bail` (StatutoryBailCalculation), `conditions`, `hearings`, `findings`, `onTabChange: (tab: TabId) => void`.
   - Derives flags from props (pure computation, no API calls).
   - Renders a horizontal scrollable list of flag chips or a vertical stacked list (depending on count).
   - Each chip: severity-colored border + icon + short label + "→" action.
   - Critical flags (rose): `ShieldAlertIcon`. Warning flags (amber): `AlertTriangleIcon`. Info flags (slate): `InfoIcon`.
2. In `BailBriefView.tsx`:
   - Compute `bail = calculateStatutoryBail(caseRecord)` (move outside JSX, currently calculated inside `StatutoryBailCard`).
   - Pass `bail`, `conditions`, `hearings`, `findings`, and `setActiveTab` into `<RiskFlagPanel>`.
   - Insert `<RiskFlagPanel>` between `<BailDisclaimer>` and the brief header card.
3. Flag logic:
   - Flag 1: `bail.status === 'accrued'`
   - Flag 2: `bail.status === 'urgent'`
   - Flag 3: conditions where `status === 'active'` and compliance events count = 0 (requires compliance data from Sub-Task 2; fall back to showing flag for all active conditions if compliance table doesn't exist yet).
   - Flag 4: hearings where `hearingDate < today` and `outcome == null || outcome === ''`.
   - Flag 5: findings where `reviewStatus === 'needs_review'`.
4. "→" click on each flag calls `onTabChange` with the relevant tab ID to switch the brief to that tab.

### Relevant Context
- `calculateStatutoryBail` is already imported in `StatutoryBailCard` — it should also be called at the `BailBriefView` level to derive flags.
- `setActiveTab` already exists as a state setter in `BailBriefView.tsx` — it can be passed down directly.
- Flag 3 (compliance) depends on Sub-Task 2; implement a simplified version (no compliance data) first, upgradeable later.

---

## Sub-Task 10 — UI/UX Updates (A, B, C, D, E)

**Status:** [ ] pending

### Intent
Apply five cross-cutting UI/UX improvements to the bail & parole section, improving visual clarity, navigation ergonomics, and usability.

### Expected Outcomes
- **A — Bail vs. Parole visual differentiation:** Parole case cards on the list page use `border-violet-200` and violet title color consistently; bail cases use teal. (Partially done by Sub-Task 1.)
- **B — Sticky tab bar:** The tab strip in `BailBriefView` is sticky on scroll (`position: sticky; top: 0`) with a white background so it doesn't disappear when scrolling through long content.
- **C — Empty state CTAs:** All empty states across `ConditionsTable`, the Judicial Orders tab, the Hearings tab, and the Findings tab have contextual action buttons/links.
- **D — Inline condition status toggle:** Each row in `ConditionsTable` has a clickable status badge that cycles through `active → completed → revoked` with a PATCH call to update the condition status.
- **E — Collapsible Overview sections:** The "Key Dates" and "Case Summary" cards in the Overview tab are individually collapsible using a chevron toggle, reducing visual clutter.

### Todo List

#### A — Bail vs. Parole visual differentiation
1. In `bail-briefs/page.tsx`, update the card border class logic: if `caseType === 'parole'` → `border-violet-200`; if `caseType === 'bail'` → `border-teal-200`; else `border-slate-200`.
2. Update the card title class: parole → `text-violet-900`, bail → `text-teal-900`.
3. Update the "View Brief →" button: parole → `bg-violet-600 text-white hover:bg-violet-700`.

#### B — Sticky tab bar
1. In `BailBriefView.tsx`, add `sticky top-0 z-10 bg-white` to the `TabsList` wrapper element.
2. Add a subtle bottom shadow `shadow-sm` to the sticky tab bar so it separates visually from content when scrolling.
3. Ensure the tab bar background is opaque (no transparency that would show content behind it).

#### C — Empty state CTAs
1. In `ConditionsTable.tsx`, update the empty state to include a note: "Conditions are added from the case detail page."
2. In `BailBriefView.tsx` Judicial Orders empty state, add a note pointing users to add orders via the case page.
3. In `BailBriefView.tsx` Findings empty state, add a note: "Run document verification to generate findings."
4. In `HearingsTab` (if it has an empty state), add "No hearings recorded. Add hearings from the case detail page."

#### D — Inline condition status toggle
1. Create a new API route `app/api/cases/[id]/conditions/[conditionId]/route.ts`:
   - `PATCH` — accepts `{ status: 'active' | 'revoked' | 'completed' }`, updates `bail_conditions.status`.
2. In `ConditionsTable.tsx`, make the status badge a clickable `<button>` that calls the PATCH endpoint.
3. Cycle order: `active → completed → revoked → active`. Show a loading spinner on the badge while saving.
4. On success, update local state optimistically (or trigger a `router.refresh()` via `useRouter`).
5. Add `caseId` prop to `ConditionsTable` (needed for the API call URL).

#### E — Collapsible Overview sections
1. In `BailBriefView.tsx` Overview tab, wrap "Key Dates" and "Case Summary" cards in a collapsible container.
2. Each card header gets a `ChevronDownIcon` / `ChevronUpIcon` toggle button (right-aligned).
3. Use `useState` per card for collapsed state; animate expand/collapse with Framer Motion `AnimatePresence` (height animation or opacity fade).
4. Default state: both expanded.
5. Persist collapsed state in `localStorage` keyed by card name so the user's preference persists across page navigations.

### Relevant Context
- `bail-briefs/page.tsx` card border logic is at lines 48–56 (the `typeCfg.highlight` conditional).
- `BailBriefView.tsx` `TabsList` is at approximately line 128; it needs `sticky top-0 z-10 bg-white` classes.
- `ConditionsTable.tsx` empty state is at lines 57–63; the table component is at line 68+.
- Framer Motion is already in use in `BailBriefView.tsx` for tab transitions — reuse the same pattern for E.

---

## Implementation Order

The sub-tasks should be implemented in this sequence to minimize dependency conflicts:

```
Sub-Task 10 (UI/UX: A, B, C, E)   ← No new DB, purely UI changes — do first as quick wins
Sub-Task 8  (Law Switcher)         ← Small DB change + single component edit
Sub-Task 1  (Parole Timeline)      ← New DB columns + new component
Sub-Task 4  (Hearing Countdown)    ← Query change + new component, no new DB
Sub-Task 5  (Print PDF Brief)      ← Pure UI/CSS, no DB
Sub-Task 7  (Audit Log)            ← Uses existing audit_events table
Sub-Task 6  (Draft Template)       ← New tab, optional AI, no new DB
Sub-Task 2  (Compliance Tracker)   ← New DB table + inline UI
Sub-Task 3  (Surety Bond Manager)  ← New DB table + new component
Sub-Task 9  (Risk Flag Panel)      ← Aggregates data from all above; implement last
Sub-Task 10D (Inline status toggle) ← New API route; do after Sub-Task 2 is stable
```

---

## Design Conventions (Reminder for Implementation)

- **Colors:** Bail → teal palette. Parole → violet palette. Critical alerts → rose. Warnings → amber. Info → slate.
- **Badges:** `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium`
- **Cards:** `bg-white rounded-lg border border-slate-200 p-5`
- **Buttons Primary:** `bg-teal-600 text-white hover:bg-teal-700` (bail) / `bg-violet-600 text-white hover:bg-violet-700` (parole)
- **Empty states:** Icon (`w-8 h-8 text-slate-300`), heading, subtext, optional CTA button.
- **Animations:** Framer Motion; respect `prefers-reduced-motion`.
- **API calls:** Follow the `fetch → toast.success/error → onUpdate?.()` pattern in `StatutoryBailCard`.
- **DB migrations:** Every schema change needs both a `lib/db/schema.ts` update AND a new `drizzle/XXXX_*.sql` migration file.
