import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hearings, cases } from '@/lib/db/schema'
import { and, gte, lte, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ?? ''
    const to = searchParams.get('to') ?? ''

    // Default: current week Mon–Sat
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)

    const fromDate = from || monday.toISOString().slice(0, 10)
    const toDate = to || saturday.toISOString().slice(0, 10)

    const rows = db
      .select({
        id: hearings.id,
        caseId: hearings.caseId,
        hearingDate: hearings.hearingDate,
        eventType: hearings.eventType,
        description: hearings.description,
        outcome: hearings.outcome,
        adjournmentReason: sql<string | null>`${hearings}.adjournment_reason`,
        judge: hearings.judge,
        court: hearings.court,
        sourceDocument: hearings.sourceDocument,
        createdAt: hearings.createdAt,
        caseNumber: cases.caseNumber,
        caseTitle: cases.title,
        caseType: cases.caseType,
        caseStatus: cases.status,
      })
      .from(hearings)
      .innerJoin(cases, eq(cases.id, hearings.caseId))
      .where(
        and(
          gte(hearings.hearingDate, fromDate),
          lte(hearings.hearingDate, toDate)
        )
      )
      .orderBy(hearings.hearingDate)
      .all()

    // Group by date
    const byDate: Record<string, typeof rows> = {}
    for (const row of rows) {
      const d = row.hearingDate.slice(0, 10)
      byDate[d] = byDate[d] ?? []
      byDate[d].push(row)
    }

    return NextResponse.json({
      fromDate,
      toDate,
      totalHearings: rows.length,
      byDate,
    })
  } catch (error) {
    console.error('[GET /api/cause-list]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
