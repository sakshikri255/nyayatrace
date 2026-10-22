# Synopsis Language Translation Plan

## Top-Level Overview

The goal is to let users translate the **already-generated synopsis** into any of the 22 Indian constitutional languages by selecting from a single global dropdown. No per-section selector — one pick translates everything at once.

There are **two separate concerns** that must both be fixed together:

1. **Gemini model name bug** — `gemini-3.8-flash` is a fake model. It causes HTTP 503 errors on every AI analysis attempt. Fix it to `gemini-2.0-flash` and also make 503 responses fall through to fallback models instead of hard-failing.

2. **Display-language translation** — Once a synopsis is rendered, a "Display language" dropdown in the synopsis header lets users pick a language. Selecting any non-English language calls `/api/translate` with all passage text across six sections (Facts, Chronology, Important Statements, Potential Inconsistencies, Missing/Unclear, Orders & Procedural History). Selecting English resets to original text instantly, no API call.

The `/api/translate` route already exists and is correct. The translation state logic (`displayLanguage`, `translations`, `translating`, `t()`, `translateSynopsis()`, `handleDisplayLanguageChange()`) was added in a previous session but was **overwritten by external file changes**. It needs to be re-applied to the current file state.

---

## Sub-Tasks

---

### Sub-Task 1 — Fix the Gemini model name and 503 fallback

**Intent**
Fix the root cause of the "Analysis Could Not Complete" error. `gemini-3.8-flash` does not exist as a Google model and returns 503 "high demand". Replace with `gemini-2.0-flash`. Also make both 404 and 503 responses fall through to the next fallback model instead of hard-throwing immediately.

**Expected Outcomes**
- Gemini analysis completes without 503 errors when the API key is valid.
- If one model is overloaded (503) the next fallback model is tried automatically.
- No changes to any UI or other files.

**Todo List**
1. In [`lib/analysis/gemini.ts`](lib/analysis/gemini.ts):
   - Line 19: Replace `FALLBACK_MODELS` with `['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest']`
   - Line 46: Change `response.status !== 404` to `response.status !== 404 && response.status !== 503`
   - Line 80: Same change for the fallback loop
   - Line 107: Change default model from `'gemini-3.8-flash'` to `'gemini-2.0-flash'`

**Relevant Context**
- File: [`lib/analysis/gemini.ts`](lib/analysis/gemini.ts)
- `callGeminiAPI()` function handles the retry logic on lines 24–99

**Status** — `[ ] pending`

---

### Sub-Task 2 — Re-apply the display-language translation feature to AnalysisWorkspace

**Intent**
The translation UI and logic was added in a previous session but was overwritten by external changes. Re-apply it to the current file state. A single "Display language" dropdown in the synopsis header translates all six sections at once using the existing `/api/translate` route.

**Expected Outcomes**
- A "Display language" dropdown appears in the synopsis header (right-aligned, only when a synopsis is visible, hidden during print).
- Selecting any of the 22 languages triggers one batched call to `/api/translate` covering all passage text in sections 3, 4, 6, 7, 8, and 9.
- A spinner appears while translating; the dropdown is disabled during translation.
- After translation a small badge "Sections 3–4, 6–8, 9 translated" appears next to the dropdown.
- Switching back to English clears translations instantly with no API call.
- Switching versions resets the translation (translations are per run+language pair).
- Source citation links (document name, page number) are never translated.
- No per-section language selector — one global dropdown controls all sections.

**Todo List**
1. Add new imports to [`components/cases/tabs/AnalysisWorkspace.tsx`](components/cases/tabs/AnalysisWorkspace.tsx):
   - Add `useCallback` and `useRef` to the React import (alongside existing `useEffect`, `useState`)
   - Add `Languages` to the lucide-react import
2. Add three state variables after the existing state block:
   - `displayLanguage` — `useState('en')`
   - `translating` — `useState(false)`
   - `translations` — `useState<Map<string, string>>(new Map())`
   - `lastTranslationKey` — `useRef<string>('')`
3. Add helper function `t(text: string): string` — returns `translations.get(text) ?? text`
4. Add `translateSynopsis(synopsis, langCode)` as a `useCallback` — collects all unique passage strings from the six sections, calls `POST /api/translate`, populates the `translations` map
5. Add `handleDisplayLanguageChange(langCode)` — sets `displayLanguage`, calls `translateSynopsis` or clears map for English
6. Add a reset `useEffect` that clears `translations` and `lastTranslationKey` whenever `selectedRunId` changes
7. In the synopsis `<header>` — add the display-language dropdown control (right-aligned pill with `Languages` icon, select element over `INDIA_LANGUAGES`, spinner during translation, confirmation badge when active)
8. In each of the six translatable sections, wrap passage text with `t()`:
   - Section 3 (Facts): `synopsis.facts.map(item => ({ ...item, passage: t(item.passage) }))`
   - Section 4 (Chronology): `t(event.passage)` in the table cell
   - Section 6 (Important Statements): same map as Section 3
   - Section 7 (Inconsistencies): `t(issue.explanation)` where `issue.explanation &&` guard already exists
   - Section 8 (Missing/Unclear): `t(item)` on each list item
   - Section 9 (Orders): same map as Section 3

**Relevant Context**
- File: [`components/cases/tabs/AnalysisWorkspace.tsx`](components/cases/tabs/AnalysisWorkspace.tsx)
- Translation API: [`app/api/translate/route.ts`](app/api/translate/route.ts) — already exists and is correct, accepts `{ texts: string[], targetLanguage: string }`, returns `{ translations: string[] }`
- Language list: [`lib/constants/languages.ts`](lib/constants/languages.ts) — `INDIA_LANGUAGES` array of `{ code, label }` — already imported in the component
- The `synopsis` variable is derived as `selectedRun?.synopsis ?? null` — only render the header and sections when `synopsis` is non-null
- The `selectedRunId` state is the key for caching — reset translations when it changes
- Do NOT add any per-section language controls — only the one global dropdown

**Status** — `[ ] pending`

---

## Implementation Notes

- Sub-Task 1 is a pure server-side fix with no UI changes. It should be done first so AI analysis works before testing the translation UI.
- Sub-Task 2 must read the **current** file before patching — the external changes have evolved the component (new `TabSection` type, new state vars, new `copyToClipboard` helpers) and the diff must be applied against what is actually there, not a stale version.
- The `/api/translate` route already handles both 503 fallback for Gemini and OpenAI fallback — no changes needed there.
