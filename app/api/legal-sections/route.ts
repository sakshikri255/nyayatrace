import { NextRequest, NextResponse } from 'next/server'
import { searchLegalSections, detectLegalSections } from '@/lib/legal/sections'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const text = searchParams.get('text')

    if (text) {
      const detected = detectLegalSections(text)
      return NextResponse.json(detected)
    }

    const results = searchLegalSections(q)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[GET /api/legal-sections]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
