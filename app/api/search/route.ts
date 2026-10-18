import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, documents, cases, findings } from '@/lib/db/schema'
import { eq, sql, and } from 'drizzle-orm'

export const runtime = 'nodejs'

export interface SearchResultItem {
  id: string
  type: 'page' | 'document' | 'finding'
  caseId: number
  caseNumber: string
  caseTitle: string
  documentId?: number
  documentName?: string
  pageNumber?: number
  snippet: string
  score?: number
}

function extractSnippet(text: string, queryWords: string[], windowSize: number = 75): string {
  if (!text) return ''
  const lower = text.toLowerCase()
  let matchIndex = -1

  for (const word of queryWords) {
    const idx = lower.indexOf(word)
    if (idx !== -1) {
      matchIndex = idx
      break
    }
  }

  if (matchIndex === -1) {
    return text.slice(0, 150) + (text.length > 150 ? '...' : '')
  }

  const start = Math.max(0, matchIndex - windowSize)
  const end = Math.min(text.length, matchIndex + windowSize)
  let snippet = text.slice(start, end).trim()

  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'

  return snippet
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const caseIdParam = searchParams.get('caseId')
    const caseId = caseIdParam ? parseInt(caseIdParam, 10) : null

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], query: q })
    }

    // Parse boolean tokens (e.g. handling AND / OR / basic terms)
    const rawTokens = q
      .replace(/["']/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 0 && !['and', 'or', 'not'].includes(t.toLowerCase()))

    const lowerTokens = rawTokens.map((t) => t.toLowerCase())
    const results: SearchResultItem[] = []

    // 1. Search in Pages
    const pageConditions = []
    if (caseId && !isNaN(caseId)) {
      pageConditions.push(eq(documents.caseId, caseId))
    }

    // Build SQL condition for pages
    if (lowerTokens.length > 0) {
      const tokenLikes = lowerTokens.map((t) => sql`${pages.extractedText} LIKE ${'%' + t + '%'}`)
      pageConditions.push(sql.join(tokenLikes, sql` AND `))
    }

    const matchedPages = db
      .select({
        pageId: pages.id,
        pageNumber: pages.pageNumber,
        extractedText: pages.extractedText,
        docId: documents.id,
        docName: documents.originalName,
        caseId: cases.id,
        caseNumber: cases.caseNumber,
        caseTitle: cases.title,
      })
      .from(pages)
      .innerJoin(documents, eq(documents.id, pages.documentId))
      .innerJoin(cases, eq(cases.id, documents.caseId))
      .where(pageConditions.length > 0 ? and(...pageConditions) : undefined)
      .limit(30)
      .all()

    for (const p of matchedPages) {
      results.push({
        id: `page-${p.pageId}`,
        type: 'page',
        caseId: p.caseId,
        caseNumber: p.caseNumber,
        caseTitle: p.caseTitle,
        documentId: p.docId,
        documentName: p.docName,
        pageNumber: p.pageNumber,
        snippet: extractSnippet(p.extractedText || '', lowerTokens),
      })
    }

    // 2. Search in Findings
    const findingConditions = []
    if (caseId && !isNaN(caseId)) {
      findingConditions.push(eq(findings.caseId, caseId))
    }
    const findingTokens = lowerTokens.map(
      (t) =>
        sql`(${findings.description} LIKE ${'%' + t + '%'} OR ${findings.extractedValue} LIKE ${'%' + t + '%'} OR ${findings.comparisonValue} LIKE ${'%' + t + '%'})`
    )
    findingConditions.push(sql.join(findingTokens, sql` OR `))

    const matchedFindings = db
      .select({
        findingId: findings.id,
        findingType: findings.findingType,
        description: findings.description,
        extractedValue: findings.extractedValue,
        comparisonValue: findings.comparisonValue,
        caseId: cases.id,
        caseNumber: cases.caseNumber,
        caseTitle: cases.title,
      })
      .from(findings)
      .innerJoin(cases, eq(cases.id, findings.caseId))
      .where(and(...findingConditions))
      .limit(10)
      .all()

    for (const f of matchedFindings) {
      results.push({
        id: `finding-${f.findingId}`,
        type: 'finding',
        caseId: f.caseId,
        caseNumber: f.caseNumber,
        caseTitle: f.caseTitle,
        snippet: `[${f.findingType}] ${f.description} (Value: ${f.extractedValue ?? '—'} vs ${f.comparisonValue ?? '—'})`,
      })
    }

    return NextResponse.json({
      query: q,
      total: results.length,
      results,
    })
  } catch (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
