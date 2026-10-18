import { NextRequest, NextResponse } from 'next/server'
import { buildCaseChronology } from '@/lib/analysis/chronology'

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

    const chronology = buildCaseChronology(caseId)
    return NextResponse.json(chronology)
  } catch (error) {
    console.error('[GET /api/cases/[id]/chronology]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
