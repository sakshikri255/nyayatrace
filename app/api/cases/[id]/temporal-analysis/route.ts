import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cases, documents, pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { analyzeTemporalContradictions } from '@/lib/analysis/temporalContradictions'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    // Check case exists
    const caseRecord = db.select({ id: cases.id }).from(cases).where(eq(cases.id, id)).get()
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Load all documents for this case
    const docRows = db.select().from(documents).where(eq(documents.caseId, id)).all()

    // Load all pages for all documents in this case
    const pageInputs: Array<{
      documentId: number
      documentName: string
      pageNumber: number
      text: string
    }> = []

    for (const doc of docRows) {
      const docPages = db
        .select({
          pageNumber: pages.pageNumber,
          extractedText: pages.extractedText,
        })
        .from(pages)
        .where(eq(pages.documentId, doc.id))
        .all()

      for (const page of docPages) {
        if (page.extractedText) {
          pageInputs.push({
            documentId: doc.id,
            documentName: doc.originalName,
            pageNumber: page.pageNumber,
            text: page.extractedText,
          })
        }
      }
    }

    const result = analyzeTemporalContradictions(pageInputs)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/cases/[id]/temporal-analysis]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
