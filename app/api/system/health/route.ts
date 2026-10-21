import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { cases, documents, pages, findings, hearings } from '@/lib/db/schema'
import { count } from 'drizzle-orm'

export const runtime = 'nodejs'

// Pre-compute base directory at module level for Turbopack compatibility
const BASE_DIR = process.cwd()

function dirSizeBytes(dir: string): number {
  let total = 0
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fp = path.join(dir, entry.name)
      if (entry.isDirectory()) total += dirSizeBytes(fp)
      else total += fs.statSync(fp).size
    }
  } catch {
    // Directory doesn't exist or permission error — return 0
  }
  return total
}

export async function GET() {
  try {
    // ── DB stats ─────────────────────────────────────────────────────────────
    const dbPath = path.join(BASE_DIR, 'local.db')
    let dbSizeBytes = 0
    try { dbSizeBytes = fs.statSync(dbPath).size } catch { /* doesn't exist */ }

    const caseCount = db.select({ cnt: count() }).from(cases).get()?.cnt ?? 0
    const documentCount = db.select({ cnt: count() }).from(documents).get()?.cnt ?? 0
    const pageCount = db.select({ cnt: count() }).from(pages).get()?.cnt ?? 0
    const findingCount = db.select({ cnt: count() }).from(findings).get()?.cnt ?? 0
    const hearingCount = db.select({ cnt: count() }).from(hearings).get()?.cnt ?? 0

    // ── Uploads dir ──────────────────────────────────────────────────────────
    const uploadsDir = path.join(BASE_DIR, 'uploads')
    const uploadsSizeBytes = dirSizeBytes(uploadsDir)

    // Orphan file detection: files on disk not referenced in DB
    let orphanCount = 0
    try {
      const dbFilePaths = new Set(
        db.select({ filePath: documents.filePath }).from(documents).all()
          .map((r) => r.filePath)
          .filter(Boolean) as string[]
      )
      const walkOrphans = (dir: string) => {
        try {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fp = path.join(dir, entry.name)
            if (entry.isDirectory()) walkOrphans(fp)
            else {
              const rel = path.relative(BASE_DIR, fp).replace(/\\/g, '/')
              if (!dbFilePaths.has(rel) && !dbFilePaths.has(fp)) orphanCount++
            }
          }
        } catch { /* directory doesn't exist or permission error */ }
      }
      walkOrphans(uploadsDir)
    } catch { /* ignore */ }

    // ── OCR / Tesseract ───────────────────────────────────────────────────────
    const tessDataDir = path.join(BASE_DIR, 'tessdata')
    const engTrainedDataPath = path.join(tessDataDir, 'eng.traineddata')
    let engTrainedDataExists = false
    let engTrainedDataSizeBytes = 0
    try {
      engTrainedDataSizeBytes = fs.statSync(engTrainedDataPath).size
      engTrainedDataExists = true
    } catch { /* doesn't exist */ }

    const availableLanguages: string[] = []
    try {
      for (const f of fs.readdirSync(tessDataDir)) {
        if (f.endsWith('.traineddata')) availableLanguages.push(f.replace('.traineddata', ''))
      }
    } catch { /* ignore */ }

    // ── AI Providers ─────────────────────────────────────────────────────────
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY)
    const openaiConfigured = Boolean(process.env.OPENAI_API_KEY)
    const geminiModel = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
    const openaiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    const activeProvider = geminiConfigured ? 'gemini' : openaiConfigured ? 'openai' : 'none'

    return NextResponse.json({
      database: {
        sizeBytes: dbSizeBytes,
        tables: { cases: caseCount, documents: documentCount, pages: pageCount, findings: findingCount, hearings: hearingCount },
      },
      uploads: {
        sizeBytes: uploadsSizeBytes,
        orphanFileCount: orphanCount,
      },
      ocr: {
        engTrainedDataFound: engTrainedDataExists,
        engTrainedDataSizeBytes,
        availableLanguages,
      },
      ai: {
        gemini: { configured: geminiConfigured, model: geminiModel },
        openai: { configured: openaiConfigured, model: openaiModel },
        activeProvider,
      },
    })
  } catch (error) {
    console.error('[GET /api/system/health]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
