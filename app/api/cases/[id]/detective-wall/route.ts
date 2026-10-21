import { NextRequest, NextResponse } from 'next/server'
import { buildCaseDetectiveWall } from '@/lib/analysis/detectiveWall'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 })
    }

    const wallData = buildCaseDetectiveWall(caseId)
    return NextResponse.json(wallData)
  } catch (error) {
    console.error('[GET /api/cases/[id]/detective-wall]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
