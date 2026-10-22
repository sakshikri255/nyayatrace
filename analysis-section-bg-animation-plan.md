# Plan: Animated Radial Glow Background on AnalysisWorkspace Sections

## Top-Level Overview

Apply the animated radial gradient glow effect from the overview/landing page to every section card inside `AnalysisWorkspace.tsx`. Each section should retain its current white background but have a 50%-opacity pulsing teal-and-gold radial gradient overlay, matching the `animate-hero-pulse` effect used on the landing page.

**Scope:** `components/cases/tabs/AnalysisWorkspace.tsx` and `app/globals.css`  
**Non-goals:** No dark-mode flip, no layout changes, no change to print styles.

---

## Sub-Tasks

---

### Sub-Task 1: Add a reusable CSS utility class for the animated section glow

**Intent:** Define a single CSS utility class (`.section-glow-bg`) in `app/globals.css` that wraps the animated radial gradient overlay pattern — so every section uses the same animation without inline duplication.

**Expected Outcomes:**
- A new CSS class `.section-glow-bg` exists in `app/globals.css`
- It uses a `::before` pseudo-element (or a direct background layering) to render pulsing teal + gold radial blobs using `animate-hero-pulse` at 50% opacity
- The class is compatible with the existing `rounded-*` and `border-*` classes already on section elements

**Todo List:**
1. Open `app/globals.css`
2. Add a new `.section-glow-bg` utility block after the existing `animate-hero-pulse` block (around line 45)
3. The block should use `position: relative; overflow: hidden;` and a `::before` pseudo-element with:
   - Two layered radial gradients: one teal (`#0D9488`) and one gold (`#C5A880`) positioned at opposite corners
   - `animation: hero-pulse 8s ease-in-out infinite`
   - `opacity: 0.5` (50% transparency as requested)
   - `pointer-events: none; z-index: 0;` so it never intercepts clicks
4. Ensure child content inside `.section-glow-bg` elements gets `position: relative; z-index: 1;` — this can be done with a `.section-glow-bg > *` rule

**Relevant Context:**
- `app/globals.css` lines 39–45: existing `hero-pulse` keyframe and `.animate-hero-pulse` class
- Landing page pattern: `LandingPageView.tsx` line 129–135 shows the exact radial gradient value used

**Status:** `[ ] pending`

---

### Sub-Task 2: Apply `.section-glow-bg` to every section container in AnalysisWorkspace

**Intent:** Add the `.section-glow-bg` class to each section-level container inside `AnalysisWorkspace.tsx` so the glow appears uniformly across all analysis sections.

**Expected Outcomes:**
- All of the following elements have `section-glow-bg` added to their `className`:
  1. Security notice div (line 512) — `rounded-xl border border-teal-200/80 bg-teal-50/70 ...`
  2. Main toolbar div (line 521) — `analysis-controls ... bg-white ...`
  3. AI provider config div (line 562) — `analysis-controls rounded-xl ... bg-white ...`
  4. Full analysis report container div (line 664) — `analysis-print rounded-2xl ... bg-white ...`
  5. `<section>` elements for all 10 analysis sections (lines 982, 1045, 1404, 1483, 1552, 1704, 1829, 1867, 1898, 1945)
- The sections retain their existing Tailwind classes — only `.section-glow-bg` is added
- The glow is clipped within each section's rounded border via `overflow: hidden`

**Todo List:**
1. Open `components/cases/tabs/AnalysisWorkspace.tsx`
2. For each of the ~14 section containers identified above, append `section-glow-bg` to the `className` string
3. Verify that all `<section>` elements already have `position` context (they do, as they use `space-y-*` and `pt-2` — the CSS `relative` is added by the `.section-glow-bg` rule)
4. Confirm print styles are not broken: `@media print` in globals.css should suppress the `::before` glow — add `@media print { .section-glow-bg::before { display: none; } }` if not already covered

**Relevant Context:**
- Sections identified by sub-agent at lines: 512, 521, 562, 664, 982, 1045, 1404, 1483, 1552, 1704, 1829, 1867, 1898, 1945
- Print suppression lives in `app/globals.css` lines 95–110

**Status:** `[ ] pending`
