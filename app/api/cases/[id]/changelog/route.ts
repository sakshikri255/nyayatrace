import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditEvents } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const rows = db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.caseId, caseId), eq(auditEvents.eventType, 'bail_field_changed')))
      .orderBy(desc(auditEvents.performedAt))
      .limit(100)
      .all()

    const events = rows.map((row) => {
      let parsed: { field?: string; oldValue?: unknown; newValue?: unknown } = {}
      try {
        parsed = JSON.parse(row.description ?? '{}')
      } catch { /* ignore */ }
      return {
        id: row.id,
        field: parsed.field ?? 'unknown',
        oldValue: parsed.oldValue ?? null,
        newValue: parsed.newValue ?? null,
        performedAt: row.performedAt,
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('[GET /api/cases/[id]/changelog]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
