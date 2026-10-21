# Plan: Parallel PDF Page OCR (cap 10)

## Overview

**Goal**: Process PDF pages within a single document in parallel instead of sequentially,
capped at a maximum of 10 concurrent pages.

**Scope**: `lib/ocr/index.ts` only. The file upload loop in `DocumentsTab.tsx` and the
API route `app/api/documents/route.ts` remain unchanged — files still process one at a time.

**Approach**: Replace the sequential `for` loop over PDF pages with a `Promise.all`-based
parallel executor that uses a lightweight semaphore (no external library). Each concurrent
page gets its own dedicated Tesseract worker so there is no shared mutable state.

---

## Sub-Tasks

---

### Sub-Task 1 — Add a parallel page runner utility inside `lib/ocr/index.ts`

**Intent**  
Introduce a `runWithConcurrency` helper that accepts an array of async tasks and a
concurrency cap, running at most N tasks simultaneously. This replaces the need for an
external library like `p-limit`.

**Expected Outcomes**  
- A typed helper function exists inside `lib/ocr/index.ts` (not exported — internal use only).
- It accepts `tasks: Array<() => Promise<T>>` and `limit: number` and returns `Promise<T[]>`
  preserving input order.
- All existing tests (if any) still pass; TypeScript compiles cleanly.

**Todo List**  
- [ ] Add `runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]>`
      above `processDocument` in `lib/ocr/index.ts`.
- [ ] Implement using a slot-based approach: maintain an active counter, resolve tasks as
      slots free up, preserve result order.
- [ ] Verify TypeScript compiles with `npx tsc --noEmit`.

**Relevant Context**  
- File: `lib/ocr/index.ts`
- No external packages needed — plain `Promise` + async/await.

**Status**: [x] done

---

### Sub-Task 2 — Extract single-page OCR logic into a self-contained `processPage` function

**Intent**  
The current page-processing block (canvas render + Tesseract) inside the `for` loop uses the
shared `ocrWorker` variable. Moving it into its own function that creates and destroys its own
worker makes it safe to run in parallel.

**Expected Outcomes**  
- A new internal async function `processPage(page, pageNumber, totalPages, ocrLang)` exists
  that: creates its own Tesseract worker, renders, runs OCR, terminates the worker, and returns
  a `PageResult`.
- The shared `let ocrWorker` variable is removed from `processDocument`.
- Embedded-text pages (no OCR needed) skip worker creation entirely.
- All log lines from Sub-Task area are preserved/adapted for the new structure.

**Todo List**  
- [ ] Add `processPage` function above `processDocument`.
- [ ] Move canvas creation, `page.render`, `ocrWorker.recognize`, and result parsing into it.
- [ ] Each call to `processPage` creates its own worker via `createSafeTesseractWorker` and
      terminates it in a `finally` block before returning.
- [ ] For pages that have embedded text (no OCR path), skip worker creation and return early.
- [ ] Remove the shared `let ocrWorker` variable and its `finally` cleanup block from
      `processDocument`.
- [ ] Verify TypeScript compiles with `npx tsc --noEmit`.

**Relevant Context**  
- File: `lib/ocr/index.ts`, lines 88–160 (current shared-worker loop + finally block).
- `createSafeTesseractWorker` already handles fallback to `eng` — reuse as-is.
- Per-page log lines: `[OCR] Page X/Y: ...` — keep the same format.

**Status**: [x] done

---

### Sub-Task 3 — Replace the sequential loop with parallel execution

**Intent**  
Wire Sub-Tasks 1 and 2 together: build the task array for all PDF pages, run them through
`runWithConcurrency` with a cap of 10, then sort results back into page order.

**Expected Outcomes**  
- `processDocument` no longer contains a sequential `for` loop over pages.
- Pages run in parallel, at most 10 at a time.
- Results are sorted by `pageNumber` before being returned, so callers receive pages in order.
- The top-level summary log (`PDF processing complete`) still fires after all pages finish.
- TypeScript compiles cleanly; `npx tsc --noEmit` passes.

**Todo List**  
- [ ] Inside the PDF branch of `processDocument`, after `await loadingTask.promise`, build
      `tasks` as an array of `() => processPage(...)` calls for each page number 1..numPages.
- [ ] Call `runWithConcurrency(tasks, 10)` and await the result.
- [ ] Sort the resulting `PageResult[]` by `pageNumber` ascending.
- [ ] Remove the old `for` loop and the `finally` block that terminated the shared worker.
- [ ] Update the summary log to reflect parallel execution (e.g. `[OCR] PDF: 8 pages processed in parallel, cap=10`).
- [ ] Run `npx tsc --noEmit` to confirm no type errors.

**Relevant Context**  
- File: `lib/ocr/index.ts`, lines 90–173.
- The `document.destroy()` call in the existing `finally` block must be kept — move it to
  after `runWithConcurrency` resolves.
- `pdfjs-dist` page objects: `document.getPage(n)` is called per task inside `processPage`;
  concurrent calls to `getDocument` and `getPage` are safe in pdfjs-dist.

**Status**: [x] done

---

## Notes for Implementation

- The concurrency cap constant `10` can be a module-level `const MAX_PARALLEL_PAGES = 10`
  for easy future tuning.
- Do NOT change `DocumentsTab.tsx` or `app/api/documents/route.ts`.
- Image files (`.jpg`, `.jpeg`, `.png`) are single-page — no loop, no change needed there.
- Keep all existing `[OCR]` log prefixes so server output stays consistent.
