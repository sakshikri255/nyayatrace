import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documentAnnotations, documents } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get('caseId')
    const docIdParam = searchParams.get('documentId')

    if (!caseIdParam && !docIdParam) {
      return NextResponse.json({ error: 'caseId or documentId required' }, { status: 400 })
    }

    if (caseIdParam) {
      const caseId = parseInt(caseIdParam, 10)
      const list = db
        .select({
          id: documentAnnotations.id,
          caseId: documentAnnotations.caseId,
          documentId: documentAnnotations.documentId,
          pageNumber: documentAnnotations.pageNumber,
          selectedText: documentAnnotations.selectedText,
          note: documentAnnotations.note,
          tag: documentAnnotations.tag,
          color: documentAnnotations.color,
          createdAt: documentAnnotations.createdAt,
          documentName: documents.originalName,
        })
        .from(documentAnnotations)
        .leftJoin(documents, eq(documents.id, documentAnnotations.documentId))
        .where(eq(documentAnnotations.caseId, caseId))
        .orderBy(desc(documentAnnotations.createdAt))
        .all()

      return NextResponse.json(list)
    }

    const docId = parseInt(docIdParam!, 10)
    const list = db
      .select()
      .from(documentAnnotations)
      .where(eq(documentAnnotations.documentId, docId))
      .orderBy(desc(documentAnnotations.createdAt))
      .all()

    return NextResponse.json(list)
  } catch (error) {
    console.error('[GET /api/annotations]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseId, documentId, pageNumber, note, tag = 'general', color = 'amber', selectedText } = body

    if (!caseId || !documentId || !pageNumber || !note || typeof note !== 'string' || !note.trim()) {
      return NextResponse.json({ error: 'caseId, documentId, pageNumber, and note are required' }, { status: 400 })
    }

    const newAnnotation = db
      .insert(documentAnnotations)
      .values({
        caseId: Number(caseId),
        documentId: Number(documentId),
        pageNumber: Number(pageNumber),
        selectedText: typeof selectedText === 'string' ? selectedText.trim() : null,
        note: note.trim(),
        tag: tag || 'general',
        color: color || 'amber',
      })
      .returning()
      .get()

    return NextResponse.json(newAnnotation, { status: 201 })
  } catch (error) {
    console.error('[POST /api/annotations]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
