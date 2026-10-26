# Security

This document describes the security measures in NyayaTrace and known limitations. **This application has not undergone a formal security audit.**

---

## Authentication and Authorization

### Authentication mechanism

- Users are authenticated via email and password.
- Passwords are hashed using **bcryptjs** with a cost factor of 10 before storage in the `users` table.
- On successful login, a random hex session token is inserted into the `sessions` table with a **7-day expiry**.
- The token is delivered to the browser as an **HttpOnly, SameSite=Lax** cookie named `nyayasetu_session`. In production (`NODE_ENV=production`), the `Secure` flag is also set.

### Session validation

- `middleware.ts` checks for the presence of the `nyayasetu_session` cookie on all non-API, non-auth routes. If absent, the request is redirected to `/login`.
- Individual API routes that require authentication call `getRequiredSession(request)` from `lib/auth-server.ts`, which validates the token against the `sessions` table and checks the expiry timestamp.
- Expired sessions are deleted from the database on next access.

### Known authorization limitations

- **API routes are not globally guarded.** The Next.js middleware does not block unauthenticated API requests. Only routes that explicitly call `getRequiredSession` enforce authentication. Routes that do not call it are accessible to anyone who can reach the server.
- **Role-based access control (RBAC) is not enforced.** The `users` table has a `role` field (`advocate`, `clerk`, `admin`), but no API route currently checks the role before allowing an operation.
- **The client-side auth module (`lib/auth.ts`) does not protect data.** It stores a session record in `localStorage` for UI state only. Clearing or spoofing `localStorage` does not grant server-side access, but it could disrupt the UI.

---

## Input Validation and Sanitization

### File upload validation (`app/api/documents/route.ts`)

- **File size:** Uploads are rejected if the file is empty or larger than 20 MB.
- **Extension check:** Only `.pdf`, `.jpg`, `.jpeg`, `.png` are accepted.
- **Magic byte check:** The first bytes of the file are checked against known PDF (`%PDF-`), JPEG (`0xFF 0xD8 0xFF`), and PNG (`0x89 PNG`) signatures. Files that do not match their declared extension are rejected.
- **Duplicate detection:** SHA-256 hash of the file is compared against existing documents in the same case. Duplicate files are rejected with HTTP 409.

### API route input validation

- Case creation validates `title`, `caseType`, and `status` against allowed enum values before inserting.
- Numeric ID parameters are parsed with `parseInt` and checked with `isNaN` before use in queries.
- Text fields are trimmed before storage to prevent whitespace-only values.

### OCR text sanitization

- `lib/legalSanitizer.ts` and `lib/ocrSanitizer.ts` apply regex-based cleaning to OCR output before it is stored or sent to AI providers.
- `lib/analysis/gemini.ts` applies an additional sanitization pass (`sanitizePageTextForLLM`) before sending text to the Gemini API.

---

## Secret and Environment Variable Management

- **All API keys are stored in `.env.local`**, which is listed in `.gitignore` and must never be committed.
- `.env.example` contains only empty placeholder values and comments. It does not contain real keys.
- API keys are accessed only in server-side code (`app/api/` routes). Client components cannot access `process.env.*` values that are not explicitly exposed via `NEXT_PUBLIC_*` (none are currently used).
- **The session cookie name** (`nyayasetu_session`) is not secret, but the session token value must be treated as a credential.
- **The SQLite database file** (`nyayatrace.db`) is checked into the repository for development seeding. If it ever contains real case data or personal information, it must be removed from version control immediately.

---

## API and Database Security

### SQL injection

- All database access uses **Drizzle ORM**, which parameterizes all queries. Raw string interpolation into SQL is avoided.
- The one exception is the FTS5 search in `app/api/search/route.ts`, which uses a raw `better-sqlite3` `prepare` + `all` call. The user query is sanitized by removing special FTS5 characters (`"`, `'`, `*`, `-`, `+`, `^`, `(`, `)`, `~`) before being passed to the prepared statement.

### File serving

- Uploaded files are served by `app/api/documents/[id]/file/route.ts`, which reads from the `uploads/` directory.
- **There is no authentication check on the file-serving route.** Anyone who knows a document's ID and can reach the server can download the file. This is a known limitation for the local-use design of this application.

### Header security

- `poweredByHeader: false` is set in `next.config.mjs`, which removes the `X-Powered-By: Next.js` header.
- Response compression (gzip) is enabled via `compress: true`.
- No `Content-Security-Policy`, `X-Frame-Options`, or `Strict-Transport-Security` headers are currently configured. These should be added before any public-facing deployment.

---

## Error Logging and Handling

- API routes use `console.error` to log errors server-side. Logs are visible in the terminal during development.
- Error responses to the client contain a human-readable message (`{ "error": "..." }`) but never expose internal stack traces, file paths, or sensitive data.
- The OCR pipeline logs detailed per-page timing and quality information to the server console. This is appropriate for local development but should be reviewed before production deployment.

---

## Dependency Management

- Dependencies are pinned to minor versions (e.g., `^14.2.35` for Next.js). Review and update them regularly.
- `better-sqlite3`, `tesseract.js`, and `pdfjs-dist` are listed as allowed native-script packages in `package.json` under `allowScripts`. Only explicitly listed packages are permitted to run install scripts.
- No `npm audit` baseline has been established. Run `npm audit` before any deployment and address high-severity vulnerabilities.

---

## Security Limitations and Recommended Improvements

The following limitations exist in the current implementation. They are acceptable for local single-user use but should be addressed before any networked or multi-user deployment.

| Limitation | Recommendation |
|---|---|
| API routes are not universally authenticated | Add `getRequiredSession` to all mutation API routes (POST, PATCH, DELETE) |
| File serving has no auth check | Add session validation to `GET /api/documents/[id]/file` |
| No RBAC enforcement | Implement role checks in routes that should be admin-only |
| No security headers | Add CSP, X-Frame-Options, HSTS via Next.js response headers config |
| No rate limiting | Add rate limiting to auth routes to prevent brute-force attacks |
| No CSRF protection | SameSite=Lax provides partial protection; add CSRF token for non-GET mutations |
| No password reset email | The `/reset-password` route is a UI placeholder without email sending |
| Session tokens not cryptographically random on all paths | The fallback in `generateToken()` uses `Math.random()` — replace with `crypto.randomUUID()` only |
| `nyayatrace.db` in version control | Contains fictional seed data; must never contain real case data |
| No audit of AI provider output | AI-returned content is parsed and stored; ensure output is validated before rendering |
| No TLS in default setup | Use a reverse proxy with TLS for any network-accessible deployment |

---

## Privacy Considerations

- NyayaTrace is designed to handle **legal case documents** which may contain personal information, crime details, and confidential communications.
- **Do not upload real case documents** to a development or shared environment.
- **Do not expose the application on a public network** without reviewing all the limitations above.
- When AI analysis is used, extracted page text (not original binary files) is sent to the configured AI provider. Review the provider's data processing and retention policies before enabling AI features with real case data.
