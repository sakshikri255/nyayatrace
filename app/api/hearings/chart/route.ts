import { NextRequest, NextResponse } from 'next/server'
import { getCaseHearingsPerMonth, getHearingsByCaseId } from '@/lib/queries/hearings'
import { getCaseById } from '@/lib/queries/cases'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get('caseId')

    if (!caseIdParam) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }

    const caseId = parseInt(caseIdParam, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 })
    }

    const caseRecord = getCaseById(caseId)
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const chartData = getCaseHearingsPerMonth(caseId)
    const hearingRows = getHearingsByCaseId(caseId)

    return NextResponse.json({
      chartData,
      caseTitle: caseRecord.title,
      totalHearings: hearingRows.length,
    })
  } catch (error) {
    console.error('[GET /api/hearings/chart]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
