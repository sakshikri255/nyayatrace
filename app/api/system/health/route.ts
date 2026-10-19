import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { cases, documents, pages, findings, hearings } from '@/lib/db/schema'
import { count } from 'drizzle-orm'

export const runtime = 'nodejs'

function safeCount(table: Parameters<typeof db.select>[0] extends undefined ? never : Parameters<typeof db.select>[0]): number {
  try {
    // @ts-expect-error – dynamic table reference
    return db.select({ cnt: count() }).from(table).get()?.cnt ?? 0
  } catch {
    return 0
  }
}

function dirSizeBytes(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  let total = 0
  const walk = (d: string) => {
    try {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const fp = path.join(d, entry.name)
        if (entry.isDirectory()) walk(fp)
        else total += fs.statSync(fp).size
      }
    } catch { /* ignore permission errors */ }
  }
  walk(dir)
  return total
}

export async function GET() {
  try {
    // ── DB stats ─────────────────────────────────────────────────────────────
    const dbPath = path.join(process.cwd(), 'local.db')
    const dbSizeBytes = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0

    const caseCount = db.select({ cnt: count() }).from(cases).get()?.cnt ?? 0
    const documentCount = db.select({ cnt: count() }).from(documents).get()?.cnt ?? 0
    const pageCount = db.select({ cnt: count() }).from(pages).get()?.cnt ?? 0
    const findingCount = db.select({ cnt: count() }).from(findings).get()?.cnt ?? 0
    const hearingCount = db.select({ cnt: count() }).from(hearings).get()?.cnt ?? 0

    // ── Uploads dir ──────────────────────────────────────────────────────────
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const uploadsSizeBytes = dirSizeBytes(uploadsDir)

    // Orphan file detection: files on disk not referenced in DB
    let orphanCount = 0
    try {
      const dbFilePaths = new Set(
        db.select({ filePath: documents.filePath }).from(documents).all()
          .map((r) => r.filePath)
          .filter(Boolean) as string[]
      )
      const walk = (dir: string) => {
        if (!fs.existsSync(dir)) return
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fp = path.join(dir, entry.name)
          if (entry.isDirectory()) walk(fp)
          else {
            const rel = path.relative(process.cwd(), fp).replace(/\\/g, '/')
            if (!dbFilePaths.has(rel) && !dbFilePaths.has(fp)) orphanCount++
          }
        }
      }
      walk(uploadsDir)
    } catch { /* ignore */ }

    // ── OCR / Tesseract ───────────────────────────────────────────────────────
    const tessDataDir = path.join(process.cwd(), 'tessdata')
    const engTrainedDataPath = path.join(tessDataDir, 'eng.traineddata')
    const engTrainedDataExists = fs.existsSync(engTrainedDataPath)
    const engTrainedDataSizeBytes = engTrainedDataExists ? fs.statSync(engTrainedDataPath).size : 0

    const availableLanguages: string[] = []
    if (fs.existsSync(tessDataDir)) {
      try {
        for (const f of fs.readdirSync(tessDataDir)) {
          if (f.endsWith('.traineddata')) availableLanguages.push(f.replace('.traineddata', ''))
        }
      } catch { /* ignore */ }
    }

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
