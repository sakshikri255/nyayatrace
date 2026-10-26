# Setup and Deployment

This guide covers how to install, configure, and run NyayaTrace locally or deploy it. For a quick start, see [`README.md`](README.md).

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| Node.js | 18.x LTS | 20.x LTS recommended |
| npm | 9.x | Bundled with Node.js |
| Git | Any recent version | For cloning the repository |
| Disk space | ~500 MB | Includes `node_modules` and Tesseract data |

**No Docker, no external database, no cloud account required** for core functionality. All data is stored locally.

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/sakshikri255/nyayatrace.git
cd nyayatrace

# 2. Install dependencies (including native modules)
npm install
```

> **Windows note:** `better-sqlite3` and `@napi-rs/canvas` are native Node.js addons that require compilation. If you encounter build errors, install the Windows Build Tools:
> ```
> npm install -g windows-build-tools
> ```
> Or install Visual Studio Build Tools manually.

---

## Database Setup

Apply all pending Drizzle migrations to create or update the database schema:

```bash
npm run db:migrate
```

This creates `nyayatrace.db` in the project root if it does not exist. The command is idempotent — running it multiple times is safe.

**Optional: seed demo data**

```bash
npm run db:seed-demo       # Load fictional demo cases
npm run db:seed-aditi      # Load the Aditi demo case specifically
npm run db:seed-showcase   # Load showcase demo data
npm run db:seed-rathore    # Load the Rathore demo case
npm run db:remove-demo     # Remove all demo seed data
```

Demo seed data contains **fictional case information only**. Never seed a production database with real case data.

---

## Environment Configuration

Copy the template file and edit it:

```bash
# Windows
copy .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

Then open `.env.local` and fill in the API keys you need. **All variables are optional** — the application runs without any API keys, but AI features will not be available.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | — (AI disabled) |
| `GOOGLE_API_KEY` | Alternative Gemini key name | — |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.0-flash` |
| `OPENAI_API_KEY` | OpenAI API key | — (AI disabled) |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o-mini` |
| `GROQ_API_KEY` | Groq API key | — (AI disabled) |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |
| `OPENROUTER_API_KEY` | OpenRouter API key | — (AI disabled) |
| `OPENROUTER_MODEL` | OpenRouter model string | `openai/gpt-4o-mini` |
| `OLLAMA_BASE_URL` | Ollama server URL | — (local LLM disabled) |
| `OLLAMA_MODEL` | Ollama model name | — |

**Security rules:**
- Never commit `.env.local`. It is listed in `.gitignore`.
- Never put API keys in `.env.example` (use empty values or placeholder text).
- Variables are read only by server-side API routes, never by the browser.

### Groq Model Note

The model name `llama-3.3-70b-versatile` may not be available on all Groq accounts. Use the Groq console to find a currently valid model name (e.g. `llama3-70b-8192`) and set it in `GROQ_MODEL`.

### Ollama Setup

To use the local Ollama provider:

```bash
# 1. Install Ollama: https://ollama.com/download
# 2. Start the Ollama server
ollama serve
# 3. Pull a model
ollama pull llama3
# 4. Add to .env.local:
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3
```

---

## Local Development

```bash
npm run dev
```

The development server starts at [http://localhost:3000](http://localhost:3000) using **Turbopack**. You will be redirected to the login page.

**Demo credentials (seeded automatically on first login):**

| Email | Password |
|---|---|
| aditi@nyayasetu.in | Demo@1234 |
| rohan@nyayasetu.in | Demo@1234 |

### Useful development commands

```bash
npm run lint           # ESLint check
npx tsc --noEmit      # TypeScript type check (no output)
npm run db:generate   # Regenerate migration files after schema changes
npm run db:push       # Push schema directly to DB (dev only, skips migration)
```

---

## Production Build

```bash
npm run build    # Compile and optimize
npm run start    # Start the production server
```

The production build enables the PWA (Progressive Web App) service worker and response compression. The app listens on port 3000 by default.

---

## Deployment

NyayaTrace is designed for **local single-user or small-team deployment** on a developer's machine or an on-premises server. It is **not configured for public multi-user hosting**.

### Self-hosted (Linux server or developer machine)

1. Clone the repository and run `npm install` on the target machine.
2. Create `.env.local` with any desired AI provider keys.
3. Run `npm run db:migrate` to set up the database.
4. Run `npm run build` followed by `npm run start`.
5. Optionally use a process manager like `pm2` to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start npm --name "nyayatrace" -- start
   pm2 save
   pm2 startup
   ```

### Important deployment considerations

- **The `uploads/` directory** stores all uploaded case documents. Back this directory up regularly.
- **The `nyayatrace.db` file** is the only database. Back it up regularly. SQLite supports hot backups with `.backup` or a simple file copy while the server is stopped.
- **Do not expose the server on a public IP** without adding authentication at the network level (e.g., VPN, SSH tunnel, or a reverse proxy with access controls). The current auth system is designed for trusted local access, not public internet exposure.
- **HTTPS:** If you expose the server beyond localhost, configure a reverse proxy (nginx, Caddy) with TLS. The `secure` flag on the session cookie is enabled automatically when `NODE_ENV=production`.
- **Environment variables in production:** Use the target system's environment variable mechanism (`.env.local`, systemd environment file, PM2 env config) rather than hardcoding values.

### Vercel deployment (unverified)

The project uses Next.js App Router and is theoretically deployable to Vercel, but this has not been tested or verified. SQLite is a local file database and does not work in serverless environments without a file-based persistence layer (e.g., Vercel KV, Turso, or Neon Serverless Postgres). A SQLite-to-hosted-DB migration would be required for a fully serverless deployment. **Do not attempt Vercel deployment without addressing this.**

---

## Tessdata (OCR Language Files)

The `tessdata/` directory contains Tesseract language model files. The English model (`eng.traineddata`) is included in the root of the project. The `tessdata/` directory is loaded by the OCR pipeline at runtime.

If you need additional languages (Hindi, Bengali, Tamil, etc.), download the corresponding `.traineddata` files from the [Tesseract tessdata repository](https://github.com/tesseract-ocr/tessdata) and place them in `tessdata/`.

---

## Common Setup Errors

| Error | Likely Cause | Fix |
|---|---|---|
| `better-sqlite3` build error on Windows | Missing C++ build tools | Install Visual Studio Build Tools or run `npm install -g windows-build-tools` |
| `Cannot find module '@napi-rs/canvas'` | Native module not compiled | Run `npm install` again; check Node.js version compatibility |
| `Tesseract worker timeout` | Missing or incorrect tessdata file | Ensure `eng.traineddata` is in `tessdata/` directory |
| `Database: no such table` | Migrations not applied | Run `npm run db:migrate` |
| `Gemini API error (HTTP 404)` | Invalid model name | Check `GEMINI_MODEL` in `.env.local`; the app will auto-fallback to `gemini-2.0-flash` |
| `Groq model doesn't exist` | Invalid model name | Update `GROQ_MODEL` to a currently valid Groq model name |
| `Port 3000 already in use` | Another process using the port | Stop the other process or set `PORT=3001` before starting |
| OCR produces garbled text | Low-quality scan | Try re-scanning at higher DPI; use the "Reprocess Page" option |
| Session cookie not set | Browser blocking cookies | Ensure browser allows cookies for localhost |

---

## Upgrading

When pulling new code:

```bash
git pull
npm install          # Install any new dependencies
npm run db:migrate   # Apply any new migrations
npm run build        # Rebuild (production)
npm run dev          # Or restart dev server
```

Always run `npm run db:migrate` after pulling changes that include new migration files in `drizzle/`.
