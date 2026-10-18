import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conditionComplianceEvents, bailConditions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; conditionId: string } }
) {
  try {
    const conditionId = parseInt(params.conditionId, 10)
    if (isNaN(conditionId)) {
      return NextResponse.json({ error: 'Invalid conditionId' }, { status: 400 })
    }
    const rows = db
      .select()
      .from(conditionComplianceEvents)
      .where(eq(conditionComplianceEvents.conditionId, conditionId))
      .orderBy(desc(conditionComplianceEvents.eventDate))
      .all()
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[GET compliance events]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; conditionId: string } }
) {
  try {
    const conditionId = parseInt(params.conditionId, 10)
    if (isNaN(conditionId)) {
      return NextResponse.json({ error: 'Invalid conditionId' }, { status: 400 })
    }
    const body = await request.json() as { eventDate: string; eventType: 'complied' | 'violated'; note?: string }
    if (!body.eventDate || !['complied', 'violated'].includes(body.eventType)) {
      return NextResponse.json({ error: 'eventDate and valid eventType required' }, { status: 400 })
    }

    const inserted = db.insert(conditionComplianceEvents).values({
      conditionId,
      eventDate: body.eventDate,
      eventType: body.eventType,
      note: body.note ?? null,
    }).returning().get()

    // If violated, mark condition status as revoked
    if (body.eventType === 'violated') {
      db.update(bailConditions)
        .set({ status: 'revoked' })
        .where(eq(bailConditions.id, conditionId))
        .run()
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (error) {
    console.error('[POST compliance event]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
