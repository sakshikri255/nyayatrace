import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { extractSections } from '@/lib/analysis/sectionExtractor'
import { LEGAL_SECTIONS_DB } from '@/lib/legal/sections'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface ExtractedSectionFrequency {
  section: string
  law: string
  count: number
  matches: Array<{
    documentId: number
    documentName: string
    pageNumber: number
    passage: string
  }>
  bailable?: 'Bailable' | 'Non-Bailable'
  offense?: string
  concordanceHref: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case id' }, { status: 400 })
    }

    // Get all pages for this case
    const casePages = db
      .select({
        pageId: pages.id,
        pageNumber: pages.pageNumber,
        extractedText: pages.extractedText,
        documentId: documents.id,
        documentName: documents.originalName,
      })
      .from(pages)
      .innerJoin(documents, eq(documents.id, pages.documentId))
      .where(eq(documents.caseId, caseId))
      .all()

    const freq: Record<string, {
      section: string
      law: string
      count: number
      matches: ExtractedSectionFrequency['matches']
    }> = {}

    for (const p of casePages) {
      if (!p.extractedText) continue
      const detected = extractSections(p.extractedText, p.pageId, p.documentId)
      for (const d of detected) {
        const key = `${d.section}-${d.law}`
        if (!freq[key]) {
          freq[key] = {
            section: d.section,
            law: d.law,
            count: 0,
            matches: [],
          }
        }
        freq[key].count += 1
        freq[key].matches.push({
          documentId: p.documentId,
          documentName: p.documentName,
          pageNumber: p.pageNumber,
          passage: d.rawMatch,
        })
      }
    }

    // Sort by frequency
    const sorted = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 20)

    // Enrich with metadata from LEGAL_SECTIONS_DB
    const results: ExtractedSectionFrequency[] = sorted.map((item) => {
      const meta = LEGAL_SECTIONS_DB.find(
        (s) => s.ipcSection === item.section || s.bnsSection === item.section
      )
      return {
        ...item,
        bailable: meta?.bailable,
        offense: meta?.offense,
        concordanceHref: `/concordance?section=${encodeURIComponent(item.section)}&law=${encodeURIComponent(item.law)}`,
      }
    })

    return NextResponse.json({ results, total: results.length })
  } catch (error) {
    console.error('[GET /api/cases/[id]/legal-sections/extracted]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
