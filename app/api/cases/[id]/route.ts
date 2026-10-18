import { NextRequest, NextResponse } from 'next/server'
import { getCaseById, deleteCase } from '@/lib/queries/cases'
import { getDocumentsByCaseId } from '@/lib/queries/documents'
import { getFindingsByCaseId } from '@/lib/queries/findings'
import { getHearingsByCaseId } from '@/lib/queries/hearings'
import { db } from '@/lib/db'
import { cases, judicialOrders, bailConditions, auditEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const BAIL_AUDIT_FIELDS = [
  'remandDate', 'statutoryPeriodDays', 'chargesheetFiled', 'chargesheetDate',
  'applicableLaw', 'paroleGrantDate', 'paroleEndDate', 'paroleReportingFrequency',
] as const

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const caseData = getCaseById(id)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const [docList, findingList, hearingList, orderList, conditionList] =
      await Promise.all([
        getDocumentsByCaseId(id),
        getFindingsByCaseId(id),
        getHearingsByCaseId(id),
        db
          .select()
          .from(judicialOrders)
          .where(eq(judicialOrders.caseId, id))
          .orderBy(judicialOrders.orderDate)
          .all(),
        db
          .select()
          .from(bailConditions)
          .where(eq(bailConditions.caseId, id))
          .all(),
      ])

    return NextResponse.json({
      ...caseData,
      documents: docList,
      findings: findingList,
      hearings: hearingList,
      orders: orderList,
      conditions: conditionList,
    })
  } catch (error) {
    console.error('[GET /api/cases/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json()
    const allowed = [
      'caseNumber',
      'title',
      'description',
      'status',
      'caseType',
      'court',
      'jurisdiction',
      'judge',
      'remandDate',
      'statutoryPeriodDays',
      'chargesheetFiled',
      'chargesheetDate',
      'applicableLaw',
      'paroleGrantDate',
      'paroleEndDate',
      'paroleReportingFrequency',
    ] as const
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (!(key in body)) continue
      const value = body[key]
      if (key === 'title' && (typeof value !== 'string' || !value.trim())) {
        return NextResponse.json({ error: 'A case title is required.' }, { status: 400 })
      }
      if (key === 'caseNumber' && (typeof value !== 'string' || !value.trim())) {
        return NextResponse.json({ error: 'Case number cannot be empty.' }, { status: 400 })
      }
      if (key === 'caseType' && !['criminal', 'civil', 'bail', 'parole', 'unspecified'].includes(value)) {
        return NextResponse.json({ error: 'Invalid case type.' }, { status: 400 })
      }
      if (key === 'status' && !['active', 'closed', 'pending', 'stayed', 'unspecified'].includes(value)) {
        return NextResponse.json({ error: 'Invalid procedural status.' }, { status: 400 })
      }
      updates[key] = typeof value === 'string' ? value.trim() || null : value
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Capture pre-update values for bail audit fields
    const preUpdate = getCaseById(id)

    let updated
    try {
      updated = db
        .update(cases)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(cases.id, id))
        .returning()
        .get()
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
        return NextResponse.json({ error: 'Case number already exists.' }, { status: 409 })
      }
      throw error
    }

    if (!updated) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Write audit log entries for changed bail fields
    if (preUpdate) {
      const now = new Date().toISOString()
      for (const field of BAIL_AUDIT_FIELDS) {
        if (!(field in updates)) continue
        const oldVal = preUpdate[field as keyof typeof preUpdate]
        const newVal = updates[field]
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          db.insert(auditEvents).values({
            caseId: id,
            eventType: 'bail_field_changed',
            description: JSON.stringify({ field, oldValue: oldVal, newValue: newVal }),
            performedAt: now,
          }).run()
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/cases/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const success = deleteCase(id)
    if (!success) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Case deleted successfully' })
  } catch (error) {
    console.error('[DELETE /api/cases/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
