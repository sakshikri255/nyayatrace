/**
 * POST /api/cases/:id/legal-sections/detect
 *
 * Auto-detect applicable legal sections from case documents (extracted OCR text).
 * Fully synchronous — no external AI calls. Returns instantly.
 *
 * Flow:
 * 1. Query all DB pages for the case.
 * 2. Run the regex-based sectionExtractor to build a section → frequency map.
 * 3. Enrich with LEGAL_SECTIONS_DB metadata (offense, bailable, keyElements).
 * 4. Generate a static relevance note from the actual matched passages found in
 *    the document text — no fabrication, no network calls.
 * 5. Attach pre-curated landmark judgments from lib/legal/landmarkJudgments.ts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { extractSections } from '@/lib/analysis/sectionExtractor'
import { LEGAL_SECTIONS_DB } from '@/lib/legal/sections'
import { getLandmarkJudgments, type LandmarkJudgment } from '@/lib/legal/landmarkJudgments'
import type { ExtractedSectionFrequency } from '../extracted/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface DetectedSectionWithJudgments extends ExtractedSectionFrequency {
  /** Human-readable description of the provision */
  provisionDescription: string | null
  /** Relevance note derived from actual document matches — no AI, no fabrication */
  caseRelevance: string | null
  /** Source used to identify the section */
  detectionSource: 'document_text' | 'case_description'
  /** Landmark judgments for this section */
  landmarkJudgments: LandmarkJudgment[]
  /** Whether judgment data is from the verified static library */
  judgmentsVerified: boolean
}

export interface DetectResponse {
  caseId: number
  detectedAt: string
  totalSections: number
  sections: DetectedSectionWithJudgments[]
  /** Any non-fatal warning */
  warning: string | null
}

/**
 * Build a static relevance note from the actual matched passages.
 * Never invents facts — only reports what was literally found in the document text.
 */
function buildStaticRelevanceNote(
  section: string,
  law: string,
  offense: string | undefined,
  matches: ExtractedSectionFrequency['matches'],
  count: number
): string {
  const lawLabel = law ? ` ${law}` : ''
  const offenseLabel = offense ? ` (${offense})` : ''

  // Collect unique source document names
  const seen = new Set<string>()
  const docNames: string[] = []
  for (const m of matches) {
    if (!seen.has(m.documentName)) { seen.add(m.documentName); docNames.push(m.documentName) }
    if (docNames.length >= 3) break
  }
  const docList = docNames.length === 1
    ? `"${docNames[0]}"`
    : docNames.map((n) => `"${n}"`).join(' and ')

  // Pull the first meaningful passage as a verbatim example
  const examplePassage = matches
    .map((m) => m.passage.trim())
    .find((p) => p.length > 4)

  const timesLabel = count === 1 ? 'once' : `${count} times`
  const baseNote = `Section${lawLabel}${offenseLabel} was referenced ${timesLabel} in ${docList}.`
  const exampleNote = examplePassage ? ` Detected as: "${examplePassage}".` : ''

  return baseNote + exampleNote
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case id' }, { status: 400 })
    }

    // ── 1. Load all pages for this case ──────────────────────────────────────
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

    // ── 2. Extract sections from page text ────────────────────────────────────
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
          freq[key] = { section: d.section, law: d.law, count: 0, matches: [] }
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

    const sorted = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 20)

    // ── 3. Enrich with static metadata + static relevance note + judgments ────
    const sections: DetectedSectionWithJudgments[] = sorted.map((item) => {
      const meta = LEGAL_SECTIONS_DB.find(
        (s) => s.ipcSection === item.section || s.bnsSection === item.section
      )
      const caseRelevance = buildStaticRelevanceNote(
        item.section,
        item.law,
        meta?.offense,
        item.matches,
        item.count,
      )
      return {
        ...item,
        bailable: meta?.bailable,
        offense: meta?.offense,
        concordanceHref: `/concordance?section=${encodeURIComponent(item.section)}&law=${encodeURIComponent(item.law)}`,
        provisionDescription: meta?.keyElements ?? null,
        detectionSource: 'document_text' as const,
        caseRelevance,
        landmarkJudgments: getLandmarkJudgments(item.section, item.law),
        judgmentsVerified: true,
      }
    })

    return NextResponse.json({
      caseId,
      detectedAt: new Date().toISOString(),
      totalSections: sections.length,
      sections,
      warning: null,
    } satisfies DetectResponse)
  } catch (error) {
    console.error('[POST /api/cases/[id]/legal-sections/detect]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
