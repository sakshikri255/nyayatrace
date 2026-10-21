import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { processDocument } from '@/lib/ocr/index'
import path from 'node:path'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docId = parseInt(params.id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document id' }, { status: 400 })
    }

    const body = await request.json() as { pageId?: number }
    const { pageId } = body
    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    // Get the document
    const [doc] = db.select().from(documents).where(eq(documents.id, docId)).all()
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get the page
    const [page] = db.select().from(pages).where(eq(pages.id, pageId)).all()
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const filePath = doc.filePath
      ? path.isAbsolute(doc.filePath)
        ? doc.filePath
        : path.join(process.cwd(), doc.filePath)
      : path.join(process.cwd(), 'uploads', doc.filename)

    // Re-run OCR on the full document and find the matching page
    const results = await processDocument(filePath, doc.language ?? 'eng')
    const pageResult = results.find((r) => r.pageNumber === page.pageNumber)

    if (!pageResult) {
      return NextResponse.json({ error: 'Page not found in OCR output' }, { status: 404 })
    }

    // Update the page in DB
    db.update(pages)
      .set({
        extractedText: pageResult.text || null,
        quality: pageResult.quality,
      })
      .where(eq(pages.id, pageId))
      .run()

    return NextResponse.json({
      id: page.id,
      pageNumber: page.pageNumber,
      quality: pageResult.quality,
    })
  } catch (error) {
    console.error('[POST /api/documents/[id]/reprocess-page]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
