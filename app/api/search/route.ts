import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, documents, cases, findings } from '@/lib/db/schema'
import { eq, sql, and } from 'drizzle-orm'
import Database from 'better-sqlite3'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    // 1b. FTS5 search (additive — append results not already in list)
    if (q.length >= 3) {
      try {
        const dbPath = path.join(process.cwd(), 'nyayatrace.db')
        const rawDb = new Database(dbPath, { readonly: true })
        const ftsQuery = q.replace(/['"*\-+^()~]/g, ' ').trim() + '*'
        const ftsRows = rawDb.prepare(`
          SELECT
            p.id AS page_id,
            p.page_number,
            p.extracted_text,
            d.id AS doc_id,
            d.original_name AS doc_name,
            c.id AS case_id,
            c.case_number,
            c.title AS case_title,
            snippet(pages_fts, 0, '<mark>', '</mark>', '...', 20) AS fts_snippet
          FROM pages_fts
          JOIN pages p ON p.id = pages_fts.rowid
          JOIN documents d ON d.id = p.document_id
          JOIN cases c ON c.id = d.case_id
          WHERE pages_fts MATCH ?
          LIMIT 10
        `).all(ftsQuery) as Array<{
          page_id: number
          page_number: number
          extracted_text: string | null
          doc_id: number
          doc_name: string
          case_id: number
          case_number: string
          case_title: string
          fts_snippet: string | null
        }>
        rawDb.close()

        const existingIds = new Set(results.map((r) => r.id))
        for (const row of ftsRows) {
          const id = `page-${row.page_id}`
          if (existingIds.has(id)) continue
          results.push({
            id,
            type: 'page',
            caseId: row.case_id,
            caseNumber: row.case_number,
            caseTitle: row.case_title,
            documentId: row.doc_id,
            documentName: row.doc_name,
            pageNumber: row.page_number,
            snippet: row.fts_snippet ?? extractSnippet(row.extracted_text ?? '', lowerTokens),
          })
        }
      } catch {
        // FTS5 not available or table not yet created — skip silently
      }
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
