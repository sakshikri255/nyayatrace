import { NextRequest, NextResponse } from 'next/server'
import { getFindingsByCaseId, getFindingWithSources } from '@/lib/queries/findings'

export const runtime = 'nodejs'

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

    const rows = getFindingsByCaseId(caseId)

    // Enrich each finding with its sources
    const data = rows.map((f) => {
      const withSources = getFindingWithSources(f.id)
      return withSources ?? { ...f, sources: [] }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/findings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
