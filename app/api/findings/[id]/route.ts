import { NextRequest, NextResponse } from 'next/server'
import { getFindingWithSources, updateFindingStatus } from '@/lib/queries/findings'

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

    const finding = getFindingWithSources(id)
    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    return NextResponse.json(finding)
  } catch (error) {
    console.error('[GET /api/findings/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json() as {
      reviewStatus?: string
      note?: string
      performedBy?: string
    }

    const { reviewStatus, note, performedBy } = body

    const validStatuses = ['verified', 'needs_review', 'not_a_discrepancy']
    if (!reviewStatus || !validStatuses.includes(reviewStatus)) {
      return NextResponse.json(
        { error: 'reviewStatus must be one of: verified, needs_review, not_a_discrepancy' },
        { status: 400 }
      )
    }

    const updated = updateFindingStatus(
      id,
      reviewStatus as 'verified' | 'needs_review' | 'not_a_discrepancy',
      performedBy ?? null,
      note
    )

    if (!updated) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/findings/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
