import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documentAnnotations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    db.delete(documentAnnotations).where(eq(documentAnnotations.id, id)).run()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/annotations/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
