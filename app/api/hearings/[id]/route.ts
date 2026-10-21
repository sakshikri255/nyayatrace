import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hearings, cases } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

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
      hearingDate?: string
      eventType?: string
      description?: string
      outcome?: string
      adjournmentReason?: string
      judge?: string
      court?: string
    }

    const { hearingDate, eventType, description, outcome, adjournmentReason, judge, court } = body

    // Build update object — only include provided fields
    const updateData: Record<string, unknown> = {}
    if (hearingDate !== undefined) updateData.hearingDate = hearingDate
    if (eventType !== undefined) updateData.eventType = eventType
    if (description !== undefined) updateData.description = description
    if (outcome !== undefined) updateData.outcome = outcome
    if (adjournmentReason !== undefined) updateData.adjournmentReason = adjournmentReason
    if (judge !== undefined) updateData.judge = judge
    if (court !== undefined) updateData.court = court

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    db.update(hearings).set(updateData).where(eq(hearings.id, id)).run()

    // Return updated hearing with case info
    const [updated] = db
      .select({
        id: hearings.id,
        caseId: hearings.caseId,
        hearingDate: hearings.hearingDate,
        eventType: hearings.eventType,
        description: hearings.description,
        outcome: hearings.outcome,
        adjournmentReason: hearings.adjournmentReason,
        judge: hearings.judge,
        court: hearings.court,
        caseNumber: cases.caseNumber,
        caseTitle: cases.title,
        caseType: cases.caseType,
        caseStatus: cases.status,
      })
      .from(hearings)
      .innerJoin(cases, eq(cases.id, hearings.caseId))
      .where(eq(hearings.id, id))
      .all()

    if (!updated) {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/hearings/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
