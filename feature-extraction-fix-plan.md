# Feature Extraction Fix Plan

> **Scope confirmed by user:** Sub-Tasks 1–4 only. Sub-Task 5 (Ollama) is excluded.
> **Fallback story:** When `generateStoryAndDossier` finds no dossier matches at all, produce a single generic sentence only.
> **Groq note:** The configured Groq model (`llama-3.3-70b-versatile`) is returning a "model doesn't exist" error. Sub-Task 4 updates the prompt quality but does NOT rely on Groq for runtime testing. Gemini is the primary AI path for validation.

## Top-Level Overview

**Goal:** Fix NyayaTrace's key feature section cards so each one shows a short, coherent, plain-English story of what happened on that page — not a raw copy-paste of OCR text. The expandable "Read Technical Dossier" must contain the raw passages and structured metadata; the main card body must show the generated narrative.

**Root Cause Summary:**
The local (non-AI) extraction path in `generateStoryAndDossier` (lib/legalSanitizer.ts) does build a `caseStory` from template sentences, but that story often contains only 1–2 generic template lines because the fallback (`storyParts.length < 2`) directly pastes the first raw OCR sentences into `storyParts`. When there are enough template hits the story is coherent, but when the page contains mixed or atypical content the fallback dumps raw OCR paragraphs into `caseStory` and they flow directly into the visible card body. The `passage` field (900 chars raw OCR, capped by `excerpt()`) is also passed as `rawText` to `ZigZagLegalCard`, which renders whichever is longer — so on pages where `caseStory` is absent or short the card shows the full 900-char OCR dump. The AI path (Gemini/Groq) generates proper narratives, but API key reliability means users often fall back to local extraction, where the problem is most visible.

**Scope:**
- Fix the `generateStoryAndDossier` fallback in `lib/legalSanitizer.ts`
- Tighten the `excerpt()` / `passage` limit and ensure it goes into the dossier, not the story
- Fix `ZigZagLegalCard` render priority so the dossier contains raw text and the story is always shown in the card body
- Fix the AI verifiedCitations path so `passage` in `EvidenceReference` is populated from AI-generated narratives, not left as raw OCR
- Add a local Ollama/llama.cpp provider option as a fallback when cloud keys fail
- No schema changes, no UI redesign, no demo data

---

## Sub-Tasks

---

### Sub-Task 1 — Fix the `generateStoryAndDossier` fallback in `lib/legalSanitizer.ts`

**Status:** `[ ] pending`

**Intent:**
The current fallback in `generateStoryAndDossier` (lines 439–446) pushes raw OCR sentences directly into `storyParts` when fewer than 2 template patterns matched. This raw text then surfaces as `caseStory` and appears in the visible card body. The fix is to replace this fallback with a smarter sentence-selection strategy that still produces a readable narrative, and to hard-cap the story to a maximum word count so it is always a short summary.

**Expected Outcomes:**
- `caseStory` is always ≤ 5 coherent sentences, written in active voice, using extracted entities (parties, acts, dates) rather than raw OCR fragments
- Pages that do not match any template pattern produce a graceful minimal sentence ("This page contains records related to [act/court/date if detected]") rather than dumping OCR text
- The `technicalDossier` array retains all structured metadata as before

**Todo List:**
1. Open `lib/legalSanitizer.ts` and locate `generateStoryAndDossier`
2. Replace the fallback block (currently at the end of the story-builder section) with a new `buildFallbackStory(text, dossier)` helper that:
   - Constructs a minimal 1–2 sentence story from already-extracted dossier items (court name, act, date, parties) so specific facts are preserved
   - If dossier is empty, produces a generic but coherent sentence: "This document page contains legal records that could not be automatically classified."
   - Never pastes raw OCR text into the story
3. Cap `storyParts.slice(0, 5)` to also enforce a 120-word hard limit by trimming the last sentence at the word boundary
4. Add the cleaned raw text (first 400 chars) as an additional dossier entry labelled `"Original Passage"` so it is visible in the expandable dossier section but not in the story

**Relevant Context:**
- `lib/legalSanitizer.ts` lines 382–449: entire story builder + existing fallback
- `TechnicalDossierItem` interface (line 1–4): `{ label: string; value: string }`
- `generateStoryAndDossier` is called from `passageForPage` in `lib/analysis/synopsis.ts` (line 102)

---

### Sub-Task 2 — Fix `excerpt()` / `passage` field: stop raw OCR leaking into card body

**Status:** `[x] done`

**Intent:**
`passageForPage` in `lib/analysis/synopsis.ts` calls `excerpt(text)` and stores the result in `EvidenceReference.passage` (up to 900 raw-OCR chars). This `passage` is passed as `rawText` to `ZigZagLegalCard`, which falls back to displaying it when `caseStory` is short. Even after Sub-Task 1 the fallback path in the card component (`rawText && rawText.length > 60 ? rawText : ...`) can still render the 900-char OCR dump if `caseStory` is somehow empty. The fix has two parts:

1. In `synopsis.ts`: store the raw passage in a dedicated `rawPassage` property (or the dossier) rather than the existing `passage` field. Use `passage` only for the short display excerpt (≤ 200 chars).
2. In `ZigZagLegalCard.tsx`: ensure `rawText` is only shown inside the technical dossier, not in the main card body (the `storyText` computation should never fall back to `rawText` if `caseStory` exists).

**Expected Outcomes:**
- The main card body (`storyText`) always shows `caseStory` when it is non-empty
- Raw OCR text of any length never appears in the prominent card body
- Technical dossier always includes the original OCR passage so users can inspect the source

**Todo List:**
1. In `lib/analysis/synopsis.ts`, change `excerpt(text)` to 200 chars and rename or move the 900-char excerpt into the dossier as `"Original Passage"`
2. In `lib/legalSanitizer.ts` → `generateStoryAndDossier`: add the raw passage entry into `dossier[]` after all other dossier items (only if not already present)
3. In `components/ZigZagLegalCard.tsx`, update `storyText` derivation to: use `caseStory` if non-empty (regardless of length); only fall back to `brief` (the one-line extractInstantLegalBrief result) if `caseStory` is missing; never render `rawText` in the card body paragraph
4. Ensure the `rawText` prop is still passed into the card (for copy-to-clipboard and dossier use), but is not displayed in `<p>{storyText}</p>`

**Relevant Context:**
- `lib/analysis/synopsis.ts` `excerpt()` at line 96 and `passageForPage()` at line 101
- `components/ZigZagLegalCard.tsx` lines 140–144: the `storyText` fallback chain
- `EvidenceReference.passage` is used in multiple places; keep it populated to avoid breaking source references

---

### Sub-Task 3 — Fix the AI path: use `verifiedCitations.passage` in `EvidenceReference`

**Status:** `[x] done`

**Intent:**
When the AI path runs (Gemini/Groq), the `verifiedCitations` array contains rich 4–5 sentence AI-generated narratives per page (`passage` field). However, in `app/api/cases/[id]/analysis/route.ts`, the AI result is merged with the local synopsis's `facts[]` array, which was built from local OCR extraction. The AI `verifiedCitations` are stored in `aiAnalysis.verifiedCitations` but are not used to replace `synopsis.facts[].caseStory`. So even after an AI run, the Facts & Timeline tab still shows locally-generated (or raw OCR) stories. The fix is to populate `caseStory` on each `EvidenceReference` in `synopsis.facts[]` from the corresponding `verifiedCitations.passage` when an AI run is present.

**Expected Outcomes:**
- After an AI analysis run, each fact card in the Facts & Timeline tab shows the AI-generated narrative passage, not the local regex story
- AI-generated narratives are preserved in the merged synopsis so they survive serialization to the database

**Todo List:**
1. Open `app/api/cases/[id]/analysis/route.ts` and find the merge step where `synopsis` and `aiResult` are combined (after the provider calls)
2. Add a step that matches `aiResult.verifiedCitations[]` to `synopsis.facts[]` by `documentId` + `pageNumber`, and overwrites `fact.caseStory` with the citation's `passage`
3. For pages with no matching citation, keep the existing local `caseStory`
4. Read `lib/analysis/openai.ts` to confirm where `parseGroundedAIAnalysis` returns the merged object and ensure the merge step happens after that call

**Relevant Context:**
- `app/api/cases/[id]/analysis/route.ts`: POST handler, after provider call and before `db.insert(analysisRuns)`
- `lib/analysis/openai.ts`: `parseGroundedAIAnalysis` return type and `verifiedCitations` shape
- `AIAnalysis.verifiedCitations[]` has `{ category, passage, documentId, pageNumber }`

---

### Sub-Task 4 — Improve the local Groq prompt for `verifiedCitations`

**Status:** `[x] done`

**Intent:**
The Groq prompt in `lib/analysis/groq.ts` is shorter and less specific than the Gemini prompt. It asks for `verifiedCitations` but does not instruct the model to write 4–5 sentence narratives with specific names, dates, and references. The result is that Groq often returns single-line generic citations. The Groq prompt should mirror the Gemini instruction quality for the `verifiedCitations` field, since Groq (Llama-3.3-70b) is the most reliably available provider given the current `.env.local`.

**Expected Outcomes:**
- Groq-generated `verifiedCitations[].passage` values are rich 4–5 sentence narratives matching the Gemini standard
- Groq-generated `executiveSummary` uses the structured 4-section Gemini template (Case Overview, Key Facts & Timeline, Main Legal Arguments, Relief Requested) instead of the 3-section generic template

**Todo List:**
1. Open `lib/analysis/groq.ts`
2. Replace `systemPrompt` with the detailed instruction from `buildAnalysisInstructions` in `lib/analysis/gemini.ts`, replacing the language template literal
3. Ensure the Groq request body still includes `response_format: { type: 'json_object' }` and `temperature: 0.1`
4. Verify that `parseGroundedAIAnalysis` (called from both Groq and Gemini) handles the same JSON schema from both providers

**Relevant Context:**
- `lib/analysis/groq.ts` lines 30–46: current system prompt
- `lib/analysis/gemini.ts` `buildAnalysisInstructions()` lines 14–64: the detailed Gemini prompt
- Both providers call `parseGroundedAIAnalysis` from `lib/analysis/openai.ts`

---

## Implementation Order

Sub-tasks are ordered so each change is independently verifiable before the next begins:

```
Sub-Task 1 → Sub-Task 2 → Sub-Task 3 → Sub-Task 4
```

- Sub-Tasks 1 and 2 fix the local path (visible immediately without API keys)
- Sub-Task 3 fixes the AI merge step (requires a working Gemini API key)
- Sub-Task 4 upgrades the Groq prompt quality (code-only change; not validated by running Groq)

## Files Changed

| File | Sub-Tasks |
|---|---|
| `lib/legalSanitizer.ts` | 1, 2 |
| `lib/analysis/synopsis.ts` | 2 |
| `components/ZigZagLegalCard.tsx` | 2 |
| `app/api/cases/[id]/analysis/route.ts` | 3 |
| `lib/analysis/groq.ts` | 4 |

## Non-Goals

- No changes to the database schema or analysisRuns table format
- No changes to the UI layout, zig-zag card design, or tab structure
- No changes to OCR extraction (`lib/ocr/index.ts`)
- No creation of demo data or seed scripts
- No changes to existing cases or findings records
- No changes to OpenAI or OpenRouter providers (already have Gemini-quality prompts)
- No Ollama / local inference provider (Sub-Task 5 excluded)

## Groq Model Fix Note

The Groq model name `llama-3.3-70b-versatile` in `.env.local` is returning a "model doesn't exist" API error. Sub-Task 4 fixes the prompt quality in `lib/analysis/groq.ts`. As a separate concern, the model name in `.env.local` should be updated to a currently valid Groq model (e.g. `llama3-70b-8192`) before attempting a Groq AI run. This is a configuration note only — it is not a code change in any sub-task.
