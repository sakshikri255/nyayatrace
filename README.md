# NyayaTrace

NyayaTrace is a local case-record workspace. Create a case, upload authorized documents, extract page text, review source-linked observations, and save versioned synopses.

## Run locally

```bash
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000. The app starts with an empty case list; it does not seed records or reset the database on startup. SQLite data is stored in `nyayatrace.db`, and original uploads are stored under `uploads/`.

## Document processing

- Text-based PDFs are extracted page by page with PDF.js.
- Image-only PDF pages are rendered and processed with local Tesseract OCR.
- JPEG/PNG images are processed with Tesseract OCR.
- OCR is English-only by default. Extraction can contain errors and must be checked against the linked source page.
- Analysis is deterministic and local. It compares explicitly labeled incident dates, party names, and locations across different documents; it does not use an AI provider or produce legal conclusions.
- Use the case Synopsis tab to save versioned output, review notes, and source-linked findings. Print / Save PDF uses the browser print dialog.

### Optional AI analysis

Gemini is the preferred optional provider. Set `GEMINI_API_KEY` on the server (and optionally `GEMINI_MODEL`) to enable it. `GOOGLE_API_KEY` is also accepted. OpenAI remains available with `OPENAI_API_KEY` and optional `OPENAI_MODEL`. Provider keys are read only by the server. A user must explicitly select a configured provider before each AI run; extracted page text and document/page identifiers are sent to that provider. Returned citations are accepted only when their exact quoted text exists on the cited extracted page. AI-suggested inconsistencies must cite at least two different documents and are stored as `Needs Review`, never as verified facts. Without a configured key, local extraction analysis remains available and the interface reports that AI is not configured.

## Data and access

This app has no login or multi-user access control. Do not expose it publicly or upload confidential or restricted case files. Use only public records or records you are authorized to process. The document route serves files from the local uploads directory and is not an authentication boundary.

`npm run db:remove-demo` is an explicit, allowlisted cleanup for the original fictional seed records and their known audit events. It does not run automatically and does not reset the database. Normal schema changes are additive SQL migrations applied with `npm run db:migrate`.
