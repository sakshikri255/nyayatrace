# Contributing

This guide explains how to contribute to NyayaTrace effectively and safely. It covers both human contributors and AI coding assistants (including IBM Bob).

> **Convention note:** NyayaTrace does not have a formal team convention for all items below. Where conventions are proposed rather than established, they are marked _(recommended)_.

---

## Repository Setup

```bash
# Clone
git clone https://github.com/sakshikri255/nyayatrace.git
cd nyayatrace

# Install dependencies
npm install

# Set up database
npm run db:migrate

# Start development server
npm run dev
```

See [`SETUP_AND_DEPLOYMENT.md`](SETUP_AND_DEPLOYMENT.md) for full setup instructions including troubleshooting.

---

## Branching _(recommended)_

The current repository uses a single `master` branch. The following conventions are recommended for collaborative development:

| Branch type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/password-reset-email` |
| Fix | `fix/<short-description>` | `fix/ocr-worker-timeout` |
| Refactor | `refactor/<short-description>` | `refactor/auth-server-cleanup` |
| Documentation | `docs/<short-description>` | `docs/api-documentation` |

- Branch from `master`.
- Keep branches short-lived; merge or rebase before they diverge significantly.
- Delete branches after merging.

---

## Commit Conventions _(recommended)_

The existing commit history uses **Conventional Commits** style (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`). Follow this pattern.

```
<type>(<scope>): <short imperative description>

[optional body]

[optional footer]
```

**Examples:**
```
feat(bail): add surety bond verification status
fix(ocr): handle Tesseract worker timeout on scanned PDFs
refactor(auth): replace Math.random fallback with crypto.randomBytes
docs: add API documentation for /api/translate
```

**Rules:**
- Use the present tense ("add feature", not "added feature").
- Keep the first line under 72 characters.
- Reference issue numbers in the footer if applicable.
- Do not commit generated files (`drizzle/` migration files are an exception — commit them).

---

## Coding Standards

All existing conventions from [`AGENTS.md`](AGENTS.md) apply to human contributors as well:

- **TypeScript everywhere.** No `.js` files.
- **Tailwind CSS only.** Use `cn()` from `lib/utils.ts` for conditional classes.
- **Drizzle ORM for all DB access.** No raw SQL strings unless the pattern is established.
- **Server/client separation.** Never import server modules in client components.
- **Import alias `@/`.** Use for all cross-directory imports.
- **Error handling.** API routes return `{ error: string }` with a meaningful HTTP status.
- **File naming.** Utilities: `camelCase.ts`. Components: `PascalCase.tsx`. Routes: `route.ts`. Pages: `page.tsx`.

---

## Before Submitting a Change

Run all of these and fix every error before opening a pull request:

```bash
# 1. Lint
npm run lint

# 2. Type-check
npx tsc --noEmit

# 3. Build (catches bundle errors)
npm run build
```

If your change affects the database schema, also:

```bash
# Generate the migration
npm run db:generate

# Apply and verify it runs cleanly
npm run db:migrate
```

Commit the generated migration file in `drizzle/` along with the schema change.

---

## Pull Request Expectations _(recommended)_

A good pull request:

1. **Has a clear title** following the commit convention.
2. **Explains why**, not just what — especially for non-obvious changes.
3. **Is focused** — one logical change per PR. Do not combine unrelated fixes.
4. **Does not include unrelated refactoring.** Fix only what you were asked or intended to fix.
5. **Passes all quality checks** (lint, typecheck, build).
6. **Includes a manual testing summary** — describe what you tested and what the expected behavior is.
7. **Updates documentation** if it changes architecture, API routes, schema, or features.

---

## Testing Requirements

There is no automated test suite. For every change:

1. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
2. Manually test the affected feature using the checklists in [`TESTING_AND_QUALITY.md`](TESTING_AND_QUALITY.md).
3. Test edge cases and error conditions (missing fields, invalid IDs, unauthenticated requests).
4. For OCR changes, test with at least one real multi-page PDF.
5. For analysis changes, test with both local (no AI key) and AI (with a configured key) modes.

---

## Security and Privacy

- **Never commit real case data.** Only fictional or test data in seed scripts.
- **Never commit `.env.local`.** It is gitignored and must remain so.
- **Never add secrets to source code.** All credentials live in environment variables.
- **Do not weaken input validation.** File upload, API input, and auth validation must not be loosened.
- **Review the file-serving route** (`GET /api/documents/[id]/file`) when making auth changes — it currently has no session check.
- **Legal data is sensitive.** Changes to `lib/legal/sections.ts` or `lib/legal/landmarkJudgments.ts` must be reviewed for accuracy. Do not add fabricated or unverified data.

---

## Documentation Update Requirements

Update the relevant documentation file for every change that affects:

| Change type | Documentation to update |
|---|---|
| New or changed API route | [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) |
| Schema change | [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) |
| New or changed feature | [`FEATURES.md`](FEATURES.md) |
| Architecture change | [`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md) |
| New environment variable | [`SETUP_AND_DEPLOYMENT.md`](SETUP_AND_DEPLOYMENT.md), [`AGENTS.md`](AGENTS.md) |
| Security change | [`SECURITY.md`](SECURITY.md) |
| Any significant change | Add an entry to [`CHANGELOG.md`](CHANGELOG.md) under `[Unreleased]` |
| Roadmap item completed | Remove from [`ROADMAP.md`](ROADMAP.md) and add to `CHANGELOG.md` |

---

## Working with IBM Bob and Other AI Coding Assistants

### Getting good results

- Read [`AGENTS.md`](AGENTS.md) before starting a session — it contains project-specific constraints.
- Give Bob specific, scoped tasks rather than broad rewrites.
- Reference file paths and function names explicitly: _"In `lib/legalSanitizer.ts`, in the `generateStoryAndDossier` function, …"_
- Ask Bob to inspect files before changing them.
- Review every change Bob makes before committing — AI output must be validated by a human.

### After a Bob session

- Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Manually test the affected feature.
- Review the diff for unintended changes (Bob should only change what was requested).
- Update documentation for any change that affects the items listed above.
- Add an entry to `CHANGELOG.md`.

### For legal data changes

Bob must not add entries to `lib/legal/sections.ts` or `lib/legal/landmarkJudgments.ts` without verified citations. Always instruct Bob explicitly: _"Do not fabricate legal data. Use only verifiable, publicly available sources."_

---

## Questions and Issues

If you encounter a bug, unclear documentation, or a security concern:

1. Check [`SECURITY.md`](SECURITY.md) for known limitations before reporting a security issue.
2. Check [`ROADMAP.md`](ROADMAP.md) — the issue may already be tracked.
3. Open a GitHub issue on [github.com/sakshikri255/nyayatrace](https://github.com/sakshikri255/nyayatrace) with a clear description and reproduction steps.
