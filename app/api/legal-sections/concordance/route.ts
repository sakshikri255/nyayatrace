import { NextRequest, NextResponse } from 'next/server'
import { searchLegalSections, getCorrespondingSection, LEGAL_SECTIONS_DB } from '@/lib/legal/sections'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const from = searchParams.get('from') as 'ipc' | 'bns' | 'crpc' | 'bnss' | null
    const category = searchParams.get('category')
    const bailable = searchParams.get('bailable')

    let results = q ? searchLegalSections(q) : LEGAL_SECTIONS_DB

    // If 'from' is specified, try exact section lookup first
    if (q && from) {
      const exact = getCorrespondingSection(q, from)
      if (exact) {
        return NextResponse.json({ results: [exact], total: 1, query: q })
      }
    }

    // Filter by category
    if (category && ['offense', 'procedure', 'evidence'].includes(category)) {
      results = results.filter((r) => r.category === category)
    }

    // Filter by bailable
    if (bailable === 'true') {
      results = results.filter((r) => r.bailable === 'Bailable')
    } else if (bailable === 'false') {
      results = results.filter((r) => r.bailable === 'Non-Bailable')
    }

    return NextResponse.json({ results, total: results.length, query: q })
  } catch (error) {
    console.error('[GET /api/legal-sections/concordance]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
