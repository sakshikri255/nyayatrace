import { NextRequest, NextResponse } from 'next/server'
import { getBailBriefData } from '@/lib/queries/cases'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const data = getBailBriefData(caseId)
    if (!data) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/cases/[id]/bail-brief]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
