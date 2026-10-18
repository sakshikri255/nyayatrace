import { NextRequest, NextResponse } from 'next/server'
import { getAllCases } from '@/lib/queries/cases'
import { db } from '@/lib/db'
import { cases } from '@/lib/db/schema'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const type = searchParams.get('type') ?? undefined

    const data = getAllCases(search, status, type)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/cases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseNumber: submittedCaseNumber, title: submittedTitle } = body

    const title = typeof submittedTitle === 'string' ? submittedTitle.trim() : ''
    if (!title) {
      return NextResponse.json(
        { error: 'A case title is required' },
        { status: 400 }
      )
    }

    const validTypes = ['criminal', 'civil', 'bail', 'parole', 'unspecified']
    const caseType = body.caseType || 'unspecified'
    if (!validTypes.includes(caseType)) {
      return NextResponse.json({ error: 'Invalid caseType' }, { status: 400 })
    }

    const validStatuses = ['active', 'closed', 'pending', 'stayed', 'unspecified']
    const status = body.status || 'unspecified'
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const caseNumber =
      typeof submittedCaseNumber === 'string' && submittedCaseNumber.trim()
        ? submittedCaseNumber.trim()
        : `NT-${randomUUID()}`

    const newCase = db
      .insert(cases)
      .values({
        caseNumber,
        title,
        description:
          typeof body.description === 'string'
            ? body.description.trim() || null
            : null,
        caseType,
        court: typeof body.court === 'string' ? body.court.trim() || null : null,
        jurisdiction:
          typeof body.jurisdiction === 'string'
            ? body.jurisdiction.trim() || null
            : null,
        judge: typeof body.judge === 'string' ? body.judge.trim() || null : null,
        remandDate: typeof body.remandDate === 'string' ? body.remandDate.trim() || null : null,
        statutoryPeriodDays: typeof body.statutoryPeriodDays === 'number' ? body.statutoryPeriodDays : 60,
        chargesheetFiled: body.chargesheetFiled ? 1 : 0,
        chargesheetDate: typeof body.chargesheetDate === 'string' ? body.chargesheetDate.trim() || null : null,
        status,
      })
      .returning()
      .get()

    return NextResponse.json(newCase, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/cases]', error)
    // SQLite unique constraint on case_number
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('unique')
    ) {
      return NextResponse.json(
        { error: 'Case number already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
