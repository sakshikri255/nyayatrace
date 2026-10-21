import { NextRequest, NextResponse } from 'next/server'
import { getDocumentWithPages, deleteDocument } from '@/lib/queries/documents'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      console.warn(`[DOCUMENT] GET rejected: invalid id param "${params.id}"`)
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    console.log(`[DOCUMENT] GET document #${id}`)
    const doc = getDocumentWithPages(id)
    if (!doc) {
      console.warn(`[DOCUMENT] GET: document #${id} not found`)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    console.log(`[DOCUMENT] GET: returned document #${id} "${doc.originalName}" (${doc.pages?.length ?? 0} page(s))`)
    return NextResponse.json(doc)
  } catch (error) {
    console.error(`[DOCUMENT] GET /api/documents/${params.id} unhandled error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      console.warn(`[DOCUMENT] DELETE rejected: invalid id param "${params.id}"`)
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    console.log(`[DOCUMENT] DELETE document #${id} requested`)
    const success = deleteDocument(id)
    if (!success) {
      console.warn(`[DOCUMENT] DELETE: document #${id} not found`)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    console.log(`[DOCUMENT] DELETE: document #${id} deleted successfully`)
    return NextResponse.json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    console.error(`[DOCUMENT] DELETE /api/documents/${params.id} unhandled error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
